<script lang="ts">
  import { useCases } from '$lib/content';
</script>

<main>
  <section class="page-hero">
    <p class="eyebrow">Use Cases</p>
    <h1>Where the assessment usually finds value</h1>
    <p>
      The strongest AI opportunities usually sit in repeated admin, unanswered leads, document-heavy
      work, and owner-dependent decisions that are slowing the business down.
    </p>
  </section>

  <section class="section">
    <div class="grid cards-grid">
      {#each useCases as useCase}
        <article class="card compact">
          <h2>{useCase}</h2>
          <p>
            The assessment maps the current workflow, identifies the practical tool fit, and ranks the
            opportunity by effort, impact, and likely return.
          </p>
        </article>
      {/each}
    </div>
  </section>
</main>
