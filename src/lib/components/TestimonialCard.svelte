<script lang="ts">
  interface Props {
    name: string;
    role: string;
    quote: string;
    rating: number;
  }

  let { name, role, quote, rating }: Props = $props();
</script>

<article class="testimonial-card">
  <div class="stars" role="img" aria-label="{rating} out of 5 stars">
    {#each Array(rating) as _}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    {/each}
  </div>
  <blockquote>&ldquo;{quote}&rdquo;</blockquote>
  <div class="testimonial-author">
    <strong>{name}</strong>
    <span>{role}</span>
  </div>
</article>

<style>
  .testimonial-card {
    background: var(--color-panel);
    border: 1.5px solid var(--color-line);
    border-radius: var(--radius);
    display: grid;
    gap: 1rem;
    padding: 1.5rem;
  }

  .stars {
    color: #f59e0b;
    display: flex;
    gap: 0.15rem;
  }

  .testimonial-card blockquote {
    color: var(--color-ink-2);
    font-size: 0.92rem;
    line-height: 1.6;
    margin: 0;
  }

  .testimonial-author {
    border-top: 1px solid var(--color-line-soft);
    display: grid;
    gap: 0.15rem;
    padding-top: 0.85rem;
  }

  .testimonial-author strong {
    color: var(--color-ink);
    font-size: 0.88rem;
  }

  .testimonial-author span {
    color: var(--color-muted);
    font-size: 0.78rem;
  }
</style>
