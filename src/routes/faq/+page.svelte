<script lang="ts">
	import { faqItems } from '$lib/data/faq';

	let openIndex = $state<number | null>(null);

	function toggle(index: number) {
		openIndex = openIndex === index ? null : index;
	}
</script>

<svelte:head>
	<title>FAQ — AI Business Assessment | Agentic AI</title>
	<meta name="description" content="Common questions about our AI Business Assessment: pricing, timeline, deliverables, data privacy, and implementation." />
	<meta property="og:title" content="FAQ — AI Business Assessment | Agentic AI" />
	<meta property="og:description" content="Common questions about our AI Business Assessment: pricing, timeline, deliverables, data privacy, and implementation." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://agenticai.net.au/faq" />
	<meta name="twitter:card" content="summary" />
	<meta name="robots" content="index,follow" />
</svelte:head>

<section class="faq-hero">
	<h1>Frequently Asked Questions</h1>
	<p class="faq-subtitle">Everything you need to know before starting your AI Business Assessment</p>
</section>

<section class="faq-list">
	{#each faqItems as item, index}
		<details class="faq-item" open={openIndex === index}>
			<summary class="faq-question" onclick={() => toggle(index)}>
				<span class="faq-qmark">Q.</span>
				<span class="faq-qtext">{item.question}</span>
				<span class="faq-icon" aria-hidden="true">{openIndex === index ? '−' : '+'}</span>
			</summary>
			<div class="faq-answer">
				<p>{item.answer}</p>
			</div>
		</details>
	{/each}
</section>

<section class="faq-cta">
	<h2>Still have questions?</h2>
	<p>Book a free 5-minute call and we'll tell you if the assessment is right for your business.</p>
	<a href="/services" class="button">View Services</a>
</section>

<style>
	.faq-hero {
		padding: 4rem 1.6rem 2rem;
		text-align: center;
	}

	.faq-hero h1 {
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 700;
		color: var(--color-ink);
		margin: 0 0 0.6rem;
	}

	.faq-subtitle {
		font-size: 1.1rem;
		color: var(--color-muted);
		margin: 0 0 2rem;
	}

	.faq-list {
		max-width: 800px;
		margin: 0 auto;
		padding: 0 1.6rem 3rem;
	}

	.faq-item {
		background: var(--color-panel);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		margin-bottom: 0.8rem;
		overflow: hidden;
		transition: box-shadow 0.2s ease;
	}

	.faq-item:hover {
		box-shadow: var(--shadow);
	}

	.faq-question {
		list-style: none;
		cursor: pointer;
		padding: 1.2rem 1.4rem;
		font-weight: 600;
		font-size: 1.05rem;
		color: var(--color-ink);
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
	}

	.faq-question::-webkit-details-marker {
		display: none;
	}

	.faq-qmark {
		color: #0066ff;
		font-weight: 700;
		flex-shrink: 0;
	}

	.faq-qtext {
		flex: 1;
	}

	.faq-icon {
		font-size: 1.4rem;
		font-weight: 300;
		line-height: 1;
		color: var(--color-muted);
		flex-shrink: 0;
		margin-top: 0.1rem;
	}

	.faq-answer {
		padding: 0 1.4rem 1.4rem 2.6rem;
		color: var(--color-muted);
		font-size: 0.97rem;
		line-height: 1.6;
	}

	.faq-answer p {
		margin: 0;
	}

	.faq-cta {
		max-width: 600px;
		margin: 0 auto;
		padding: 2rem 1.6rem 4rem;
		text-align: center;
	}

	.faq-cta h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
		color: var(--color-ink);
	}

	.faq-cta p {
		color: var(--color-muted);
		margin: 0 0 1.2rem;
	}

	.faq-cta .button {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: #0066ff;
		color: #fff;
		border-radius: 6px;
		text-decoration: none;
		font-weight: 600;
		transition: background 0.2s ease;
	}

	.faq-cta .button:hover {
		background: #0052cc;
	}
</style>
