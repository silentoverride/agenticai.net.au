<script lang="ts">
  // Skeleton loader for briefing page loading state
</script>

<div class="skeleton-container">
  <div class="skeleton-header">
    <div class="skeleton-block title-block"></div>
    <div class="skeleton-block subtitle-block"></div>
  </div>
  <div class="skeleton-section">
    <div class="skeleton-block h2-block"></div>
    <div class="skeleton-block text-block"></div>
    <div class="skeleton-block text-block short"></div>
  </div>
  <div class="skeleton-section">
    <div class="skeleton-block h2-block"></div>
    <div class="skeleton-card"></div>
    <div class="skeleton-card"></div>
  </div>
  <div class="skeleton-section">
    <div class="skeleton-block h2-block"></div>
    <div class="skeleton-card wide"></div>
    <div class="skeleton-card wide"></div>
    <div class="skeleton-card wide"></div>
  </div>
</div>

<style>
  .skeleton-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }
  .skeleton-header {
    text-align: center;
    padding: 3rem 1rem;
    margin-bottom: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  .skeleton-section {
    margin-bottom: 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .skeleton-block {
    background: var(--color-panel-soft);
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: var(--radius-sm);
  }
  .title-block {
    width: 300px;
    height: 32px;
  }
  .subtitle-block {
    width: 200px;
    height: 16px;
  }
  .h2-block {
    width: 250px;
    height: 24px;
  }
  .text-block {
    width: 100%;
    height: 14px;
  }
  .text-block.short {
    width: 60%;
  }
  .skeleton-card {
    height: 100px;
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    background: var(--color-panel-soft);
    animation: shimmer 1.5s ease-in-out infinite;
  }
  @keyframes shimmer {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
  }

  @media (prefers-reduced-motion: reduce) {
    .skeleton-block, .skeleton-card {
      animation: none;
      opacity: 0.6;
    }
  }
</style>
