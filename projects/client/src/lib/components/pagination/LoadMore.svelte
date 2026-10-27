<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import { createFocusRetention } from '$lib/utils/focus/createFocusRetention.ts';
  import IconCircleMinus from '@tabler/icons-svelte/icons/circle-minus';
  import IconCirclePlus from '@tabler/icons-svelte/icons/circle-plus';
  import type { LoadMoreProps } from './_internal/LoadMoreProps.ts';

  const { showLess, showMore, onless, onmore, variant }: LoadMoreProps =
    $props();

  let navigator = $state<HTMLElement>();
  const retention = createFocusRetention();

  // A control that reached its limit leaves, so the other one takes its focus.
  $effect(() => {
    void showLess;
    void showMore;
    retention.settle(
      navigator?.querySelector<HTMLElement>('.load-more-control'),
    );
  });
</script>

{#if showLess || showMore}
  <div
    class="trakt-load-more"
    data-variant={variant}
    bind:this={navigator}
    {@attach retention.track}
  >
    {#if showLess}
      <button type="button" class="load-more-control" onclick={onless}>
        <IconCircleMinus class="load-more-glyph" aria-hidden="true" />
        {m.button_text_show_less()}
      </button>
    {/if}
    {#if showMore}
      <button type="button" class="load-more-control" onclick={onmore}>
        <IconCirclePlus class="load-more-glyph" aria-hidden="true" />
        {m.button_text_show_more()}
      </button>
    {/if}
  </div>
{/if}

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-load-more {
    position: absolute;
    left: 50%;
    z-index: var(--layer-base);
    display: inline-block;
    // A hook a caller sets to move the pill off its edge.
    margin-block-start: var(--load-more-offset, var(--ni-neg-2));
    border: var(--border-thickness-xxs) solid var(--color-border-navigator);
    border-radius: var(--border-radius-m);
    background: var(--color-surface-sunken);
    white-space: nowrap;
    transform: translateX(-50%);

    .load-more-control {
      display: inline-block;
      margin-block: var(--ni-4);
      margin-inline: var(--ni-6);
      padding: var(--ni-0);
      border: none;
      background: none;
      color: var(--color-text-primary);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-label);
      font-weight: var(--font-weight-heading-light);
      text-transform: uppercase;
      opacity: var(--navigator-item-opacity);
      cursor: pointer;
      transition:
        color var(--transition-default),
        opacity var(--transition-default);

      &:focus-visible {
        color: var(--color-accent);
        opacity: 1;
      }

      @include for-mouse {
        &:hover {
          color: var(--color-accent);
          opacity: 1;
        }
      }
    }

    :global(.load-more-glyph) {
      width: var(--icon-size-navigator);
      height: var(--icon-size-navigator);
      margin-block: var(--ni-neg-2) var(--ni-0);
      margin-inline: var(--ni-2) var(--ni-5);
      stroke-width: var(--icon-stroke-chrome);
      vertical-align: middle;
    }
  }
</style>
