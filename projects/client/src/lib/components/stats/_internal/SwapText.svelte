<script lang="ts">
  import { mergeProps } from 'bits-ui';
  import type { SwapTextProps } from './SwapTextProps.ts';

  const { text, alternate, swap, triggerProps, ...data }: SwapTextProps =
    $props();

  let isSwapped = $state(false);

  const shown = $derived(isSwapped ? alternate() : text);
</script>

{#if swap}
  <!-- Merged, trigger props first, so a tooltip's click runs before the swap's rather than replacing it. -->
  <button
    type="button"
    class="trakt-swap-text"
    {...mergeProps(
      triggerProps,
      { onclick: () => (isSwapped = !isSwapped) },
      data,
    )}
  >
    {shown}
  </button>
{:else}
  <span class="trakt-swap-text" {...data}>{text}</span>
{/if}

<style lang="scss">
  .trakt-swap-text {
    display: inline;
    margin: var(--ni-0);
    padding: var(--ni-0);
    border: none;
    background: none;
    color: inherit;
    text-align: inherit;

    &[type='button'] {
      cursor: pointer;
    }
  }
</style>
