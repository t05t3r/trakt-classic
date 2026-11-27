<script lang="ts">
  import { hint } from '$lib/components/tooltip/hint.svelte.ts';
  import IconX from '@tabler/icons-svelte/icons/x';
  import type { ClearButtonProps } from './_internal/ClearButtonProps.ts';

  const { label, isLabelShown = false, onclick }: ClearButtonProps = $props();

  // Shown, the label is the button's text and names it.
  const name = $derived(isLabelShown ? undefined : label);
</script>

{#snippet glyph()}
  <IconX class="clear-glyph" aria-hidden="true" />
{/snippet}

<!-- Shown, the label needs no tooltip. -->
<button
  type="button"
  class="trakt-clear-button"
  data-label={isLabelShown ? 'shown' : 'hidden'}
  aria-label={name}
  {onclick}
  {@attach hint(() => isLabelShown ? undefined : { content: label })}
>
  {#if isLabelShown}
    <span class="clear-label">{label}</span>
    <span class="clear-ring">{@render glyph()}</span>
  {:else}
    {@render glyph()}
  {/if}
</button>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-clear-button {
    padding: var(--ni-0);
    background: none;
    color: var(--color-text-help);
    cursor: pointer;
    transition: color var(--transition-default);

    @include for-mouse {
      &:hover {
        color: var(--color-text-primary);
      }
    }

    &[data-label='hidden'],
    .clear-ring {
      display: grid;
      flex-shrink: 0;
      place-items: center;
      width: var(--ni-40);
      height: var(--ni-40);
      border: var(--border-thickness-xxs) solid var(--color-border);
      border-radius: var(--border-radius-round);
    }

    &[data-label='shown'] {
      display: inline-flex;
      align-items: center;
      gap: var(--ni-8);
      border: none;
      font-size: var(--font-size-button);
    }

    :global(.clear-glyph) {
      width: var(--ni-16);
      height: var(--ni-16);
      stroke-width: var(--icon-stroke-chrome);
    }
  }
</style>
