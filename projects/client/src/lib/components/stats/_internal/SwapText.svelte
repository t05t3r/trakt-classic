<script lang="ts">
  import type { SwapTextProps } from './SwapTextProps.ts';

  const { text, alternate, swap, ...data }: SwapTextProps = $props();

  let isSwapped = $state(false);

  const shown = $derived(isSwapped ? alternate() : text);
</script>

{#if swap}
  <button
    type="button"
    class="trakt-swap-text"
    onclick={() => (isSwapped = !isSwapped)}
    {...data}
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
    font: inherit;
    text-align: inherit;

    &[type='button'] {
      cursor: pointer;
    }
  }
</style>
