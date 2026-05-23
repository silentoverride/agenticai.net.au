<script lang="ts">
  /**
   * AnnieChat — AI chat intake conversation UI.
   *
   * Renders chat bubbles with:
   * - User and Annie message styles
   * - Typing indicator animation
   * - Smooth scroll to bottom on new messages
   * - Fixed-height container with overflow scroll
   *
   * The component manages conversation state locally and sends user
   * responses to the server API for persistence.
   */

  import type { ChatMessage } from '$lib/assessment/intake-script';
  import { TOTAL_QUESTIONS } from '$lib/assessment/intake-script';
  import { fade } from 'svelte/transition';

  let {
    sessionId = crypto.randomUUID(),
    onComplete = () => {},
    savedState = null
  }: {
    sessionId?: string;
    onComplete?: (summary: Array<{ question: string; answer: string; followUpAnswer?: string }>) => void;
    savedState?: {
      messages: ChatMessage[];
      currentQuestionIndex: number;
      answers: Array<{ questionId: string; question: string; answer: string; followUpAnswer?: string }>;
      followUpAsked: boolean;
      currentFollowUp: string | undefined;
      lastQuestionId: string;
    } | null;
  } = $props();

  let messages = $state<ChatMessage[]>(savedState?.messages || []);
  let currentQuestionIndex = $state(savedState?.currentQuestionIndex ?? 0);
  let inputText = $state('');
  let isTyping = $state(false);
  let chatContainer: HTMLDivElement;
  let inputEl: HTMLInputElement;
  let followUpAsked = $state(savedState?.followUpAsked ?? false);
  let currentFollowUp = $state<string | undefined>(savedState?.currentFollowUp);
  let lastQuestionId = $state(savedState?.lastQuestionId ?? '');
  let answers = $state<Array<{ questionId: string; question: string; answer: string; followUpAnswer?: string }>>(savedState?.answers || []);
  let intakeScript: typeof import('$lib/assessment/intake-script').INTAKE_SCRIPT = [];

  // Load intake script questions
  $effect(() => {
    import('$lib/assessment/intake-script').then(mod => {
      intakeScript = mod.INTAKE_SCRIPT;
      if (intakeScript.length > 0 && messages.length === 0 && !savedState) {
        askQuestion(0);
      }
    });
  });

  // Save session state to localStorage on each update
  $effect(() => {
    if (messages.length > 0 && sessionId) {
      try {
        localStorage.setItem('annie-session-id', sessionId);
        localStorage.setItem('annie-session-state', JSON.stringify({
          messages,
          currentQuestionIndex,
          answers,
          followUpAsked,
          currentFollowUp,
          lastQuestionId
        }));
      } catch {
        // localStorage may be unavailable
      }
    }
  });

  // Auto-scroll on new message
  $effect(() => {
    if (messages.length && chatContainer) {
      requestAnimationFrame(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      });
    }
  });

  function askQuestion(index: number) {
    if (index >= intakeScript.length) {
      // Intake complete
      messages = [...messages, {
        role: 'annie',
        text: 'Thank you! I have everything I need to prepare your assessment. Let me put your report together — you\'ll hear from us within 48 hours with your personalised AI business assessment.',
        timestamp: new Date().toISOString(),
        isTyping: false
      }];
      isTyping = false;
      currentQuestionIndex = index;
      onComplete(answers.map(a => ({ question: a.question, answer: a.answer })));
      return;
    }

    const question = intakeScript[index];
    lastQuestionId = question.id;
    followUpAsked = false;
    currentFollowUp = undefined;

    showTyping(() => {
      messages = [...messages, {
        role: 'annie',
        text: question.question,
        timestamp: new Date().toISOString(),
        isTyping: false
      }];
      currentQuestionIndex = index;
    });
  }

  function showTyping(callback: () => void) {
    isTyping = true;
    setTimeout(() => {
      isTyping = false;
      callback();
    }, 800 + Math.random() * 700); // 0.8–1.5s delay
  }

  function handleSend() {
    const text = inputText.trim();
    if (!text || isTyping) return;

    // Add user message
    messages = [...messages, {
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
      isTyping: false
    }];
    inputText = '';

    const question = intakeScript[currentQuestionIndex];
    if (!question) return;

    if (!followUpAsked) {
      // Check for follow-up probe
      const followUpText = getFollowUpText(question.id, text);
      if (followUpText) {
        currentFollowUp = followUpText;
        followUpAsked = true;
        showTyping(() => {
          messages = [...messages, {
            role: 'annie',
            text: followUpText,
            timestamp: new Date().toISOString(),
            isTyping: false
          }];
        });
        return;
      }
    }

    // Store answer
    const existingAnswer = answers.find(a => a.questionId === question.id);
    if (existingAnswer) {
      if (followUpAsked) {
        existingAnswer.followUpAnswer = text;
      }
    } else {
      answers = [...answers, {
        questionId: question.id,
        question: question.question,
        answer: text,
        followUpAnswer: followUpAsked ? text : undefined
      }];
    }

    // Persist to server
    persistAnswer(question.id, text, followUpAsked);

    // Move to next question
    showTyping(() => {
      askQuestion(currentQuestionIndex + 1);
    });
  }

  function getFollowUpText(questionId: string, answer: string): string | undefined {
    const question = intakeScript.find(q => q.id === questionId);
    if (!question?.followUps) return undefined;

    const lowerAnswer = answer.toLowerCase();
    for (const fu of question.followUps) {
      for (const keyword of fu.keywords) {
        if (lowerAnswer.includes(keyword.toLowerCase())) {
          return fu.probe;
        }
      }
    }
    return undefined;
  }

  async function persistAnswer(questionId: string, answer: string, isFollowUp: boolean) {
    try {
      await fetch('/api/chat/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId,
          answer,
          isFollowUp,
          currentIndex: currentQuestionIndex
        })
      });
    } catch (err) {
      console.warn('[AnnieChat] Failed to persist answer:', err);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Progress percentage
  const progress = $derived(
    TOTAL_QUESTIONS > 0 ? Math.round((currentQuestionIndex / TOTAL_QUESTIONS) * 100) : 0
  );
</script>

<div class="annie-chat" role="region" aria-label="Annie AI assessment chat">
  <!-- Progress bar -->
  <div class="chat-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
    <div class="chat-progress-fill" style="width: {progress}%"></div>
    <span class="chat-progress-label">
      Question {Math.min(currentQuestionIndex + 1, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}
    </span>
  </div>

  <!-- Messages container -->
  <div bind:this={chatContainer} class="chat-messages">
    {#each messages as msg, i}
      <div
        class="chat-bubble chat-{msg.role}"
        class:chat-first={i === 0}
        in:fade={{ duration: 300 }}
      >
        {#if msg.role === 'annie'}
          <div class="annie-avatar" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
        {/if}
        <div class="bubble-content">
          <p>{msg.text}</p>
        </div>
      </div>
    {/each}

    <!-- Typing indicator -->
    {#if isTyping}
      <div class="chat-bubble chat-annie typing-indicator" in:fade={{ duration: 200 }}>
        <div class="annie-avatar" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        <div class="typing-dots" aria-label="Annie is typing">
          <span></span><span></span><span></span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Input area -->
  <div class="chat-input-area">
    <input
      bind:this={inputEl}
      bind:value={inputText}
      onkeydown={handleKeydown}
      type="text"
      class="chat-input"
      placeholder={isTyping ? 'Annie is typing...' : 'Type your answer...'}
      disabled={isTyping || currentQuestionIndex >= TOTAL_QUESTIONS}
      aria-label="Type your answer"
    />
    <button
      class="chat-send"
      onclick={handleSend}
      disabled={!inputText.trim() || isTyping || currentQuestionIndex >= TOTAL_QUESTIONS}
      aria-label="Send message"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    </button>
  </div>
</div>

<style>
  .annie-chat {
    background: var(--color-panel);
    border: 1.5px solid var(--color-line);
    border-radius: var(--radius);
    display: grid;
    grid-template-rows: auto 1fr auto;
    height: 500px;
    max-height: 70vh;
    overflow: hidden;
  }

  /* ── Progress ──────────────────────────────────────────── */
  .chat-progress {
    align-items: center;
    background: var(--color-panel-soft);
    display: flex;
    gap: 0.75rem;
    padding: 0.65rem 1rem;
  }

  .chat-progress-fill {
    background: var(--color-accent);
    border-radius: 999px;
    height: 4px;
    transition: width 400ms ease;
  }

  .chat-progress-label {
    color: var(--color-muted);
    flex-shrink: 0;
    font-size: 0.75rem;
    font-weight: 700;
  }

  /* ── Messages ──────────────────────────────────────────── */
  .chat-messages {
    display: grid;
    gap: 0.75rem;
    overflow-y: auto;
    padding: 1rem;
  }

  .chat-bubble {
    align-items: flex-start;
    display: flex;
    gap: 0.65rem;
    max-width: 85%;
  }

  .chat-annie {
    justify-self: start;
  }

  .chat-user {
    flex-direction: row-reverse;
    justify-self: end;
  }

  .chat-first {
    margin-top: auto;
  }

  .annie-avatar {
    align-items: center;
    background: var(--color-accent-light);
    border-radius: 999px;
    color: var(--color-accent);
    display: inline-flex;
    flex-shrink: 0;
    height: 2rem;
    justify-content: center;
    width: 2rem;
  }

  .bubble-content {
    background: var(--color-panel-soft);
    border-radius: 12px 12px 12px 4px;
    padding: 0.7rem 0.9rem;
  }

  .chat-user .bubble-content {
    background: var(--color-accent);
    border-radius: 12px 12px 4px 12px;
    color: #fff;
  }

  .bubble-content p {
    color: inherit;
    font-size: 0.9rem;
    line-height: 1.55;
  }

  .chat-user .bubble-content p {
    color: #fff;
  }

  /* ── Typing indicator ──────────────────────────────────── */
  .typing-dots {
    align-items: center;
    display: flex;
    gap: 4px;
    padding: 0.3rem 0;
  }

  .typing-dots span {
    animation: typingBounce 1.4s ease-in-out infinite;
    background: var(--color-muted-2);
    border-radius: 50%;
    height: 7px;
    width: 7px;
  }

  .typing-dots span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing-dots span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes typingBounce {
    0%, 60%, 100% {
      opacity: 0.3;
      transform: translateY(0);
    }
    30% {
      opacity: 1;
      transform: translateY(-4px);
    }
  }

  /* ── Input ─────────────────────────────────────────────── */
  .chat-input-area {
    align-items: center;
    border-top: 1px solid var(--color-line);
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
  }

  .chat-input {
    background: var(--color-panel-soft);
    border: 1px solid var(--color-line);
    border-radius: 999px;
    color: var(--color-ink);
    flex: 1;
    font: inherit;
    font-size: 0.9rem;
    outline: none;
    padding: 0.6rem 1rem;
    transition: border-color 150ms ease;
  }

  .chat-input:focus {
    border-color: var(--color-accent);
  }

  .chat-input:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .chat-input::placeholder {
    color: var(--color-muted-2);
  }

  .chat-send {
    align-items: center;
    background: var(--color-accent);
    border: none;
    border-radius: 999px;
    color: #fff;
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    height: 2.4rem;
    justify-content: center;
    transition: background 150ms ease;
    width: 2.4rem;
  }

  .chat-send:hover:not(:disabled) {
    background: var(--color-accent-2);
  }

  .chat-send:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
</style>
