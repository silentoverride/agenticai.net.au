<script lang="ts">
  import { services } from '$lib/content';
</script>

<div class="services-list">
  {#each services as service}
    <article class="service-row">
      <h3>{service.title}</h3>
      <p>{service.text}</p>
    </article>
  {/each}
</div>

