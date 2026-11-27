<script lang="ts">
  import DropdownButton from '$lib/components/buttons/DropdownButton.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { useHiddenSeasons } from '$lib/features/media-actions/stores/useHiddenSeasons.ts';
  import { createFocusRetention } from '$lib/utils/focus/createFocusRetention.ts';
  import { createPressHold } from '$lib/utils/focus/createPressHold.ts';
  import { fromRune } from '$lib/utils/store/fromRune.svelte.ts';
  import IconBan from '@tabler/icons-svelte/icons/ban';
  import type { SeasonsBoxProps } from './SeasonsBoxProps.ts';
  import SeasonsList from './SeasonsList.svelte';
  import type { SeasonsListProps } from './SeasonsListProps.ts';
  import type { SeasonExpansion } from './toggleSeasonExpansion.ts';

  const { show, describedBy, info }: SeasonsBoxProps = $props();

  const listId = $props.id();

  const hidden = useHiddenSeasons(fromRune(() => show));
  const { hiddenSeasons, isUpdating } = hidden;
  const hiddenCount = $derived($hiddenSeasons?.length ?? 0);

  const retention = createFocusRetention();
  const pressHold = createPressHold();
  let seasonsToggle = $state<HTMLElement>();
  let hiddenToggle = $state<HTMLElement>();

  const hide: SeasonsListProps['onhide'] = ({ seasons, trigger }) =>
    pressHold.press(trigger, () => hidden.hide(seasons));

  // A menu's trigger leaves with its hidden row, and the toggle with the last hidden season.
  $effect(() => {
    if (hiddenCount > 0 && !hiddenToggle) return;
    const trigger = pressHold.take();
    if (trigger && !trigger.isConnected) retention.remember(trigger);
    retention.settle(hiddenToggle ?? seasonsToggle);
  });

  let isOpen = $state(false);
  let isHiddenShown = $state(false);
  // Kept across a close, so the box reopens as it was left.
  let expansion = $state<SeasonExpansion>(new Set());

  // A write in flight may still bring a hidden season back; the toggle then returns as it was left.
  $effect(() => {
    if (hiddenCount === 0 && !$isUpdating) isHiddenShown = false;
  });

  // Shown, the hidden seasons join the list, so a press while closed opens it.
  const toggleHidden = () => {
    isHiddenShown = !isHiddenShown;
    if (isHiddenShown) isOpen = true;
  };
</script>

{#snippet controls()}
  <div class="trakt-seasons-controls">
    <DropdownButton
      label={m.button_text_view_seasons()}
      aria-expanded={isOpen}
      aria-controls={listId}
      aria-describedby={describedBy}
      onclick={() => (isOpen = !isOpen)}
      {@attach (element) => {
        seasonsToggle = element;
      }}
    >
      {m.button_text_view_seasons()}
    </DropdownButton>
    {#if hiddenCount > 0}
      <button
        bind:this={hiddenToggle}
        type="button"
        class="hidden-seasons-toggle no-wrap"
        aria-pressed={isHiddenShown}
        aria-controls={listId}
        aria-describedby={describedBy}
        onclick={toggleHidden}
        {@attach retention.track}
      >
        <IconBan class="hidden-seasons-glyph" aria-hidden="true" />
        {hiddenCount === 1
          ? m.button_text_hidden_seasons_one({ count: hiddenCount })
          : m.button_text_hidden_seasons_other({ count: hiddenCount })}
      </button>
    {/if}
  </div>
{/snippet}

{@render info(controls)}

<!-- Mounted while open, so a closed box observes neither query. -->
<div id={listId} class="trakt-seasons-list" class:is-open={isOpen}>
  {#if isOpen}
    <SeasonsList
      {show}
      {describedBy}
      {expansion}
      {hidden}
      onhide={hide}
      showsHidden={isHiddenShown}
      onexpansion={(next) => (expansion = next)}
    />
  {/if}
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-seasons-controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ni-10);
    align-items: stretch;
    margin-block-start: var(--ni-10);

    .hidden-seasons-toggle {
      display: inline-flex;
      column-gap: var(--ni-6);
      align-items: center;
      padding-block: var(--ni-6);
      padding-inline: var(--ni-12);
      border: var(--ni-1) solid var(--color-border);
      background: none;
      color: var(--color-text-primary);
      font-family: var(--font-family-body);
      font-size: var(--font-size-button);
      cursor: pointer;

      &[aria-pressed='true'] {
        border-color: var(--color-danger);
      }

      :global(.hidden-seasons-glyph) {
        width: var(--icon-size-last-watched);
        height: var(--icon-size-last-watched);
        stroke-width: var(--icon-stroke-chrome);
      }
    }
  }

  // A grid row of its own, under the row's cells and as wide as its divider.
  .trakt-seasons-list {
    grid-row: 2;
    grid-column: 1 / -1;
    margin-inline: var(--gutter-half);
    font-size: var(--font-size-small);

    &.is-open {
      margin-block-start: var(--ni-15);
      padding-block: var(--ni-10);
      padding-inline: var(--ni-20);
      background: var(--color-surface-menu);
    }

    // Closed, the empty list keeps the row's card off the button.
    @include for-mobile {
      grid-row: auto;
      margin-block-start: var(--gap-m);
      margin-inline: var(--ni-0);

      &.is-open {
        padding-block: var(--ni-15);
        padding-inline: var(--ni-10);
      }
    }
  }
</style>
