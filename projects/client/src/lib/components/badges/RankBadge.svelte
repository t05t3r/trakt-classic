<script lang="ts">
  const { rank }: { rank: number } = $props();
</script>

<span class="trakt-rank-badge">{rank}</span>

<style lang="scss">
  .trakt-rank-badge {
    display: inline-block;
    // The border sits inside the pill's height, as on Classic.
    box-sizing: border-box;
    min-width: var(--rank-badge-size);
    height: var(--rank-badge-size);
    padding-block: var(--ni-0);
    padding-inline: var(--ni-5);
    border: var(--border-thickness-xs) solid var(--color-rank-badge-border);
    border-radius: var(--border-radius-pill);
    background-color: var(--color-surface-menu);
    color: var(--color-text-primary);
    font-size: var(--font-size-label);
    font-weight: var(--font-weight-heading-heavy);
    line-height: var(--line-height-rank-badge);
    text-align: center;
  }
</style>
