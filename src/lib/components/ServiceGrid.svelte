<script lang="ts">
  import { services } from '$lib/content';
</script>

<div class="grid cards-grid">
  {#each services as service}
    <article class="card">
      <h3>{service.title}</h3>
      <p>{service.text}</p>
    </article>
  {/each}
</div>

