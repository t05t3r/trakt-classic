<script lang="ts">
  import IconLoader2 from '@tabler/icons-svelte/icons/loader-2';
</script>

<IconLoader2 class="trakt-pending-spinner" aria-hidden="true" />

<style lang="scss">
  // The caller sets the size and stroke to match the glyph the spinner stands in for.
  :global(.trakt-pending-spinner) {
    width: var(--pending-spinner-size);
    height: var(--pending-spinner-size);
    stroke-width: var(--pending-spinner-stroke);
    animation: spin var(--animation-duration-spin) linear infinite;
  }
</style>
