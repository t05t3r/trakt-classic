<script lang="ts">
  const { text }: { text: string } = $props();
</script>

<p class="trakt-tooltip-detail">{text}</p>

<style>
  .trakt-tooltip-detail {
    color: var(--color-text-muted);
    white-space: pre-line;
  }
</style>
