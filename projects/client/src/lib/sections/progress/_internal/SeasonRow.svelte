<script lang="ts">
  import { resolve } from '$app/paths';
  import { hint } from '$lib/components/tooltip/hint.svelte.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import { seasonLabel } from '$lib/utils/intl/seasonLabel.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import IconBan from '@tabler/icons-svelte/icons/ban';
  import IconChevronDown from '@tabler/icons-svelte/icons/chevron-down';
  import IconChevronRight from '@tabler/icons-svelte/icons/chevron-right';
  import PercentageBar from './PercentageBar.svelte';
  import ProgressStats from './ProgressStats.svelte';
  import OutlineBadge from './OutlineBadge.svelte';
  import type { SeasonRowProps } from './SeasonRowProps.ts';

  const {
    row,
    show,
    isExpanded,
    controls,
    ontoggle,
    menu,
  }: SeasonRowProps = $props();

  const { progress, isHidden } = $derived(row);
  // A season with no aired episode offers no episodes toggle.
  const hasAired = $derived(progress.total > 0);
  // From the show, since the Target is undefined while the seasons load.
  const href = $derived(UrlBuilder.season(show.slug, progress.number));
  const announced = $derived(
    row.target
      ? Math.max(row.target.episodes.count - row.target.episodes.aired, 0)
      : 0,
  );
  const toggleLabel = $derived(
    m.button_label_toggle_season_episodes({ season: progress.number }),
  );
</script>

<div class="trakt-season-row" class:is-hidden={isHidden}>
  <div class="season-head">
    {#if hasAired}
      <button
        type="button"
        class="season-toggle"
        aria-expanded={isExpanded}
        aria-controls={controls}
        aria-label={toggleLabel}
        onclick={ontoggle}
        {@attach hint(() => ({ content: toggleLabel }))}
      >
        {#if isExpanded}
          <IconChevronDown class="season-toggle-glyph" aria-hidden="true" />
        {:else}
          <IconChevronRight
            class="season-toggle-glyph trakt-icon-directional"
            aria-hidden="true"
          />
        {/if}
      </button>
    {:else}
      <!-- Keeps this season's label in line with the toggled ones. -->
      <span class="season-toggle-placeholder" aria-hidden="true"></span>
    {/if}
    <a class="season-link" href={resolve(href)}>{seasonLabel(progress.number)}</a>
    {#if progress.title}
      <span class="season-title ellipsis">{progress.title}</span>
    {/if}
    {@render menu?.()}
    {#if isHidden}
      <OutlineBadge icon={IconBan} tone="danger">
        {m.text_season_hidden()}
      </OutlineBadge>
    {/if}
    <div class="season-stats">
      <ProgressStats
        completed={progress.completed}
        total={progress.total}
        minutesLeft={progress.minutesLeft}
        {announced}
      />
    </div>
  </div>
  <div class="season-bar">
    <PercentageBar
      completed={progress.completed}
      total={progress.total}
      size="sm"
    />
  </div>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-season-row {
    padding-block: var(--ni-5);
    font-size: var(--font-size-small);

    .season-head {
      display: flex;
      column-gap: var(--ni-10);
      align-items: center;
      min-height: var(--ni-35);
    }

    .season-toggle,
    .season-toggle-placeholder {
      flex: none;
      inline-size: var(--icon-size-seasons-box);
    }

    .season-toggle {
      @include link-button;

      display: inline-flex;
      color: var(--color-text-primary);

      :global(.season-toggle-glyph) {
        width: var(--icon-size-seasons-box);
        height: var(--icon-size-seasons-box);
      }
    }

    .season-link {
      @include inherited-link-style;

      flex: none;
      color: var(--color-text-primary);
      font-family: var(--font-family-heading);
      font-weight: var(--font-weight-heading);
    }

    .season-title {
      min-width: var(--ni-0);
      color: var(--color-text-muted);
    }

    .season-stats {
      flex: 1;
      min-width: var(--ni-0);
    }

    // Its stats take a second line under the season's label and menu.
    @include for-mobile {
      .season-head {
        flex-wrap: wrap;
      }

      .season-stats {
        flex-basis: 100%;
        order: 1;
      }
    }

    &.is-hidden {
      .season-link,
      .season-title,
      .season-stats,
      .season-bar {
        @include watched-fade;
      }
    }
  }
</style>
