<script lang="ts">
  import PendingSpinner from '$lib/components/feedback/PendingSpinner.svelte';
  import type { ActionButtonProps } from './_internal/ActionButtonProps.ts';

  const {
    color,
    icon: Glyph,
    label,
    underInfo,
    selected,
    isUpdating = false,
    isInert = false,
    onclick,
    side,
  }: ActionButtonProps = $props();

  const isIgnoringClicks = $derived(selected === undefined || isInert);

  const handleClick = () => {
    if (isIgnoringClicks) return;

    onclick();
  };
</script>

<div
  class="trakt-action-button"
  data-color={color}
  class:is-selected={selected === true}
>
  <button
    type="button"
    class="action-button-main"
    aria-busy={isUpdating}
    aria-disabled={isIgnoringClicks}
    onclick={handleClick}
  >
    <span class="action-button-glyph" aria-hidden="true">
      {#if isUpdating}
        <PendingSpinner />
      {:else}
        <Glyph class="action-button-icon" />
      {/if}
    </span>
    <span class="action-button-text" class:has-under-info={underInfo}>
      <span class="action-button-label">{label}</span>
      {#if underInfo}
        <span class="action-button-under-info">{underInfo}</span>
      {/if}
    </span>
  </button>
  {#if side}
    <div class="action-button-side">
      {@render side()}
    </div>
  {/if}
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-action-button {
    --action-button-color: var(--color-action-watch);
    --action-button-darken: var(--color-action-watch-darken);
    --action-side-background: var(--color-surface-sunken);
    --action-side-color: var(--color-text-help);

    display: flex;
    min-height: var(--action-button-height);
    border: var(--border-thickness-xxs) solid var(--action-button-color);
    background: var(--color-surface-raised);
    color: var(--action-button-color);
    transition:
      background var(--transition-default),
      color var(--transition-default);

    &[data-color='list'] {
      --action-button-color: var(--color-action-list);
      --action-button-darken: var(--color-action-list-darken);
    }

    &[data-color='favorite'] {
      --action-button-color: var(--color-action-favorite);
      --action-button-darken: var(--color-action-favorite-darken);
    }

    &.is-selected {
      --action-side-background: var(--color-action-side-background-active);
      --action-side-color: var(--color-text-primary);

      background: var(--action-button-color);
      color: var(--color-text-primary);
    }

    @include for-mouse {
      &:hover {
        --action-side-background: var(
          --color-action-side-background-active
        );
        --action-side-color: var(--color-text-primary);

        background: var(--action-button-color);
        color: var(--color-text-primary);
      }

      &.is-selected:hover {
        background: var(--action-button-darken);
      }
    }

    .action-button-main {
      display: flex;
      flex: 1;
      min-width: var(--ni-0);
      padding: var(--ni-0);
      border: none;
      background: none;
      color: inherit;
      text-align: start;
      cursor: pointer;
    }

    .action-button-glyph {
      --pending-spinner-size: var(--icon-size-action);
      --pending-spinner-stroke: var(--icon-stroke-chrome);

      display: grid;
      flex-shrink: 0;
      place-items: center;
      width: var(--action-button-glyph-width);
      height: var(--action-button-height);
    }

    :global(.action-button-icon) {
      width: var(--icon-size-action);
      height: var(--icon-size-action);
      stroke-width: var(--icon-stroke-chrome);
    }

    // Classic thickens a selected glyph.
    &.is-selected :global(.action-button-icon) {
      stroke-width: var(--icon-stroke-strip);
    }

    &[data-color='favorite'] :global(.action-button-icon) {
      width: var(--icon-size-action-star);
      height: var(--icon-size-action-star);
    }

    .action-button-text {
      display: flex;
      flex-direction: column;
      padding-block: var(--ni-10);
    }

    .action-button-label {
      font-family: var(--font-family-heading);
      font-size: var(--font-size-action-label);
      font-weight: var(--font-weight-heading);
      line-height: var(--line-height-action-label);
      text-transform: uppercase;
    }

    // Classic drops the label's line height once the under-info line shows.
    .has-under-info .action-button-label {
      line-height: normal;
    }

    .action-button-under-info {
      font-size: var(--font-size-label);
      line-height: var(--line-height-text);
    }

    .action-button-side {
      display: flex;
    }
  }
</style>
