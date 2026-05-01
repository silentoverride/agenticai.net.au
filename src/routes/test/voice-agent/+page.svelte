<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  // Test scenario steps
  const TEST_SCENARIO = [
    { delay: 3000,  text: "Hi, I'm interested in an AI assessment for my business." },
    { delay: 8000,  text: "We have about 12 people in the field. I do all the scheduling myself in Excel." },
    { delay: 13000, text: "Yes, customer enquiries come into a shared Gmail inbox and I handle all the quotes." },
    { delay: 18000, text: "That sounds great, let's proceed with the assessment." },
    { delay: 25000, text: "My email is mail at lorin dot io and phone is zero four six eight three one double two three three." },
    { delay: 35000, text: "Yes, send me the payment link please." },
  ];

  let callStatus = 'idle';
  let callId = '';
  let accessToken = '';
  let transcript = '';
  let agentTranscript = '';
  let logs: string[] = [];
  let retellClient: any = null;
  let scenarioTimer: ReturnType<typeof setTimeout> | null = null;
  let stepIndex = 0;
  let autoMode = true;
  let manualInput = '';
  let audioContext: AudioContext | null = null;
  let mediaStreamDestination: MediaStreamAudioDestinationNode | null = null;
  let analyser: AnalyserNode | null = null;
  let audioLevel = 0;

  function log(msg: string) {
    const line = `[${new Date().toISOString().split('T')[1].slice(0, 12)}] ${msg}`;
    logs = [...logs, line];
    console.log(line);
  }

  async function startCall() {
    callStatus = 'connecting';
    log('Creating Retell web call...');
    try {
      const res = await fetch('/api/create-retell-web-call', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ source: 'test-platform' })
      });
      const data = await res.json();
      if (!res.ok || !data.accessToken) {
        throw new Error(data.message || 'Failed to create call');
      }
      accessToken = data.accessToken;
      callId = data.callId;
      log(`Call created: ${callId}`);
      await connectWebRTC(data.accessToken);
    } catch (err: any) {
      callStatus = 'error';
      log(`ERROR: ${err.message}`);
    }
  }

  async function connectWebRTC(token: string) {
    const { RetellWebClient } = await import('retell-client-js-sdk');
    retellClient = new RetellWebClient();

    retellClient.on('call_started', () => {
      callStatus = 'active';
      log('Call started — Annie is live');
      if (autoMode) startScenario();
    });

    retellClient.on('call_ended', () => {
      callStatus = 'ended';
      log('Call ended');
      cleanup();
    });

    retellClient.on('error', (err: any) => {
      log(`Retell error: ${err?.message || err}`);
    });

    // Listen for agent transcript updates
    retellClient.on('transcript_update', (update: any) => {
      if (update?.transcript) {
        agentTranscript = update.transcript;
        log(`AGENT: ${update.transcript.slice(-120)}`);
      }
    });

    retellClient.on('audio', (audio: any) => {
      // Audio received from agent — we can analyse levels
      analyseAgentAudio();
    });

    await retellClient.startCall({ accessToken: token, sampleRate: 24000 });

    // Setup audio injection path: TTS -> Web Audio -> virtual audio cable -> browser mic -> Retell
    await setupAudioInjection();
  }

  async function setupAudioInjection() {
    audioContext = new AudioContext({ sampleRate: 24000 });
    mediaStreamDestination = audioContext.createMediaStreamDestination();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    mediaStreamDestination.connect(analyser);

    log('Audio injection ready. Route system audio output to mic input via virtual audio cable.');
    log('Platform: macOS (BlackHole), Windows (VB-Cable), Linux (alsa-loopback).');
  }

  function analyseAgentAudio() {
    if (!analyser) return;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    audioLevel = avg / 255;
  }

  function speak(text: string) {
    if (!audioContext || !mediaStreamDestination) {
      log('Audio context not ready, falling back to SpeechSynthesis API');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => log(`TTS START: "${text.slice(0, 60)}..."`);
      utterance.onend = () => log('TTS END');
      speechSynthesis.speak(utterance);
      return;
    }

    // Advanced: synthesise speech via Web Audio API oscillator + modulator
    // For real TTS in test harness, SpeechSynthesis is sufficient — the audio
    // routes through system default output. With a virtual audio cable set as
    // default output AND default input, Retell hears the TTS as microphone input.
    log(`Speaking: "${text.slice(0, 60)}..."`);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    speechSynthesis.speak(utterance);
  }

  function startScenario() {
    log('Auto-scenario starting...');
    stepIndex = 0;
    runNextStep();
  }

  function runNextStep() {
    if (stepIndex >= TEST_SCENARIO.length) {
      log('Scenario complete. Waiting for call to end or payment link...');
      return;
    }
    const step = TEST_SCENARIO[stepIndex];
    scenarioTimer = setTimeout(() => {
      log(`STEP ${stepIndex + 1}/${TEST_SCENARIO.length}`);
      speak(step.text);
      transcript += `\n[TESTER] ${step.text}`;
      stepIndex++;
      runNextStep();
    }, step.delay);
  }

  function sendManual() {
    if (!manualInput.trim()) return;
    speak(manualInput);
    transcript += `\n[TESTER] ${manualInput}`;
    manualInput = '';
  }

  function endCall() {
    retellClient?.stopCall?.();
    callStatus = 'ended';
    cleanup();
  }

  function cleanup() {
    if (scenarioTimer) clearTimeout(scenarioTimer);
    scenarioTimer = null;
    if (audioContext) { audioContext.close(); audioContext = null; }
    mediaStreamDestination = null;
    analyser = null;
  }

  onDestroy(cleanup);

  // Poll for payment link SMS or webhook events
  async function pollForCheckoutUrl() {
    log('Polling for checkout link (simulating SMS arrival)...');
    // In a real test, you'd check Twilio logs or Stripe for the session
  }

  // After call, simulate payment completion and verify pipeline
  async function simulatePaymentSuccess() {
    log('Simulating payment success flow...');
    // Create a test checkout session
    try {
      const res = await fetch('/api/create-assessment-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          source: 'test-platform',
          customerName: 'Lorin',
          customerPhone: '+61468312233',
          customerEmail: 'mail@lorin.io',
          company: 'Agentic AI',
          transcriptPreview: transcript.slice(0, 450),
          retellCallId: callId
        })
      });
      const data = await res.json();
      if (data.url) {
        log(`Checkout URL: ${data.url}`);
        if (data.sms) log(`SMS sent: ${JSON.stringify(data.sms)}`);
      } else {
        log(`Checkout error: ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      log(`Payment flow error: ${err.message}`);
    }
  }

  async function triggerReportPipeline() {
    log('Triggering report pipeline with test transcript...');
    try {
      const res = await fetch('/api/assessment-transcript', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-session-' + Date.now(),
          transcript: transcript || 'Test transcript for pipeline validation. Owner does scheduling in Excel. Shared Gmail inbox. Owner bottleneck for quotes.',
          customerName: 'Lorin',
          customerEmail: 'mail@lorin.io',
          customerPhone: '+61468312233',
          company: 'Agentic AI',
          source: 'test-platform'
        })
      });
      const data = await res.json();
      log(`Pipeline response: ${JSON.stringify(data)}`);
    } catch (err: any) {
      log(`Pipeline error: ${err.message}`);
    }
  }
</script>

<main>
  <section class="test-header">
    <h1>Voice Agent Test Platform</h1>
    <p>Automated end-to-end testing for Annie (Retell voice agent) → Stripe → Report Pipeline</p>
  </section>

  <section class="controls">
    <div class="status-bar">
      <span class="badge {callStatus}">{callStatus.toUpperCase()}</span>
      {#if callId}<small>Call: {callId}</small>{/if}
      {#if audioLevel > 0.01}<small>Audio level: {(audioLevel * 100).toFixed(1)}%</small>{/if}
    </div>

    <div class="button-row">
      {#if callStatus === 'idle' || callStatus === 'error'}
        <button class="primary" onclick={startCall}>Start Call with Annie</button>
      {:else if callStatus === 'active'}
        <button class="danger" onclick={endCall}>End Call</button>
      {:else}
        <button class="secondary" onclick={startCall}>Start New Call</button>
      {/if}

      <label class="toggle">
        <input type="checkbox" bind:checked={autoMode} />
        Auto-scenario
      </label>
    </div>

    {#if callStatus === 'active'}
      <div class="manual-input">
        <input
          type="text"
          bind:value={manualInput}
          placeholder="Type what the tester should say..."
          onkeydown={(e) => e.key === 'Enter' && sendManual()}
        />
        <button onclick={sendManual}>Speak</button>
      </div>
    {/if}

    <div class="pipeline-actions">
      <button onclick={simulatePaymentSuccess}>Generate Checkout URL</button>
      <button onclick={triggerReportPipeline}>Trigger Report Pipeline</button>
    </div>
  </section>

  <section class="panels">
    <div class="panel">
      <h2>Agent Transcript</h2>
      <pre>{agentTranscript || '(waiting...)'}</pre>
    </div>

    <div class="panel">
      <h2>Tester Transcript</h2>
      <pre>{transcript || '(waiting...)'}</pre>
    </div>

    <div class="panel fullwidth">
      <h2>Event Log</h2>
      <pre class="logs">{logs.join('\n') || '(no events)'}</pre>
    </div>
  </section>

  <section class="guide">
    <h2>Setup Guide</h2>
    <p>
      To have the browser TTS heard by Retell's microphone input, route audio output → input
      using a virtual audio cable:
    </p>
    <ul>
      <li><strong>macOS:</strong> Install <a href="https://existential.audio/blackhole/" target="_blank">BlackHole</a>. Set BlackHole as system output AND browser input mic.</li>
      <li><strong>Windows:</strong> Install <a href="https://vb-audio.com/Cable/" target="_blank">VB-Cable</a>. Set CABLE Output as default playback, CABLE Input as default recording.</li>
      <li><strong>Linux:</strong> Use <code>alsa-loopback</code> or <code>pulseaudio-module-loopback</code>.</li>
    </ul>
    <p>
      Without virtual audio cable, use <strong>Manual mode</strong>: speak into your physical mic
      while watching the transcript and event logs.
    </p>
  </section>
</main>

<style>
  :global(body) {
    background: #0a0a0f;
    color: #e0e0e8;
  }
  .test-header {
    padding: 2rem;
    border-bottom: 1px solid #222;
  }
  .test-header h1 {
    margin: 0;
    color: #fff;
  }
  .controls {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #222;
  }
  .status-bar {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1rem;
  }
  .badge {
    padding: 0.35rem 0.75rem;
    border-radius: 0.35rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
  }
  .badge.idle { background: #333; color: #aaa; }
  .badge.connecting { background: #b8860b; color: #000; }
  .badge.active { background: #22c55e; color: #000; }
  .badge.ended { background: #555; color: #ccc; }
  .badge.error { background: #dc2626; color: #fff; }

  .button-row {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }
  button {
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 0.4rem;
    cursor: pointer;
    font-weight: 500;
  }
  button.primary { background: #0066cc; color: white; }
  button.danger { background: #dc2626; color: white; }
  button.secondary { background: #333; color: #ccc; }

  .toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #aaa;
  }

  .manual-input {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  .manual-input input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    background: #111;
    border: 1px solid #333;
    border-radius: 0.35rem;
    color: #eee;
  }

  .pipeline-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
  }
  .pipeline-actions button {
    background: #1a1a2e;
    border: 1px solid #444;
    color: #aab;
    font-size: 0.8rem;
  }

  .panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    padding: 1.5rem 2rem;
  }
  .panel {
    background: #111118;
    border: 1px solid #222;
    border-radius: 0.5rem;
    padding: 1rem;
  }
  .panel h2 {
    margin: 0 0 0.75rem;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #888;
  }
  .panel pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 0.8rem;
    line-height: 1.5;
    color: #ccc;
    max-height: 300px;
    overflow-y: auto;
  }
  .panel.fullwidth {
    grid-column: 1 / -1;
  }
  .logs {
    color: #7dd3fc;
  }

  .guide {
    padding: 1.5rem 2rem;
    border-top: 1px solid #222;
  }
  .guide h2 {
    font-size: 1rem;
    color: #fff;
    margin-bottom: 0.5rem;
  }
  .guide p, .guide li {
    font-size: 0.85rem;
    color: #aaa;
    line-height: 1.6;
  }
  .guide a {
    color: #7dd3fc;
  }
  .guide code {
    background: #1a1a2e;
    padding: 0.15rem 0.35rem;
    border-radius: 0.2rem;
  }
</style>
