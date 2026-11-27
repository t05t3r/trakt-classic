<script lang="ts">
  import { resolve } from '$app/paths';
  import DroppedBadge from '$lib/components/badges/DroppedBadge.svelte';
  import LazyImage from '$lib/features/image/components/LazyImage.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import DropMenu from '$lib/features/media-actions/components/DropMenu.svelte';
  import { useShowProgressDetail } from '$lib/features/progress/stores/useShowProgressDetail.ts';
  import { isSameMinute } from '$lib/utils/date/isSameMinute.ts';
  import { isProgressComplete } from '$lib/utils/media/isProgressComplete.ts';
  import { whenInViewport } from '$lib/utils/actions/whenInViewport.ts';
  import { fromRune } from '$lib/utils/store/fromRune.svelte.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import ProgressRowCard from './_internal/ProgressRowCard.svelte';
  import LastWatchedPill from './_internal/LastWatchedPill.svelte';
  import PercentageBar from './_internal/PercentageBar.svelte';
  import type { PercentageBarProps } from './_internal/PercentageBarProps.ts';
  import ProgressStats from './_internal/ProgressStats.svelte';
  import SeasonRegions from './_internal/SeasonRegions.svelte';
  import SeasonsBox from './_internal/SeasonsBox.svelte';
  import type { ProgressRowProps } from './ProgressRowProps.ts';

  const { row, isFaded = false, droppedAt }: ProgressRowProps = $props();

  const titleId = $props.id();
  let isInView = $state(false);
  const { watchedFlags, detail } = useShowProgressDetail(
    fromRune(() => row.show),
    { enabled: fromRune(() => isInView), onlyWhileHidingSeasons: true },
  );
  // The watched progress still counts a hidden season's watch and next episode, which the show's own read leaves out.
  const hidingDetail = $derived(
    $detail && $detail.hiddenSeasons.length > 0 ? $detail : undefined,
  );
  const nextEpisode = $derived(
    hidingDetail ? hidingDetail.nextEpisode : row.nextEpisode,
  );
  const lastWatchedAt = $derived(
    hidingDetail ? ($watchedFlags?.latestWatchAt ?? null) : row.lastWatchedAt,
  );

  const showHref = $derived(UrlBuilder.show(row.show.slug));
  // The cached flags miss a mark made while the box was closed, so they must match the row, to the minute.
  const segments = $derived.by(() => {
    if (!$watchedFlags) return undefined;

    const { flags, latestWatchAt } = $watchedFlags;
    const isCurrent = flags.length === row.total &&
      flags.filter(Boolean).length === row.completed &&
      (hidingDetail !== undefined ||
        isSameMinute(latestWatchAt, row.lastWatchedAt));

    return isCurrent ? flags : undefined;
  });
  // Only flags that match the row line its seasons up with the bar.
  const regionSeasons = $derived(segments && $detail?.seasons);
  let highlight = $state.raw<PercentageBarProps['highlight']>();
</script>

<div
  class="trakt-progress-row"
  class:is-faded={isFaded}
  class:is-dropped={droppedAt != null}
  data-layout="grid"
  data-grid-variant="twenty-four-columns"
  use:whenInViewport={() => (isInView = true)}
>
  <!-- The title beside it links to the same page. -->
  <a
    class="row-poster"
    href={resolve(showHref)}
    tabindex="-1"
    aria-hidden="true"
    data-grid-column
    data-grid-span="three-twenty-fourths"
  >
    <LazyImage
      src={row.show.poster.url.thumb}
      alt={m.image_alt_media_poster({ title: row.show.title })}
      kind="poster"
    />
    {#if droppedAt}
      <DroppedBadge {droppedAt} />
    {/if}
  </a>

  <SeasonsBox show={row.show} describedBy={titleId}>
    {#snippet info(seasonsControls)}
      <div
        class="row-info"
        data-grid-column
        data-grid-span="fifteen-twenty-fourths"
      >
        <!-- The year and the menu sit beside the heading, so the heading is named by the show alone. -->
        <div class="row-title">
          <div class="row-name">
            <h3 id={titleId} class="row-heading">
              <a class="row-show-link ellipsis" href={resolve(showHref)}>
                {row.show.title}
              </a>
            </h3>
            {#if row.show.year}
              <span class="row-year">{row.show.year}</span>
            {/if}
          </div>
          <!-- The menu reads its show once, so another show gets another menu. -->
          {#key row.show.id}
            <DropMenu
              show={{ id: row.show.id, title: row.show.title }}
              variant="status"
              status={{ isComplete: isProgressComplete(row), droppedAt }}
              describedBy={titleId}
            />
          {/key}
        </div>

        <div class="row-bar">
          <PercentageBar
            completed={row.completed}
            total={row.total}
            size="lg"
            {segments}
            {highlight}
          >
            {#snippet overlay()}
              {#if regionSeasons}
                <SeasonRegions
                  seasons={regionSeasons}
                  {nextEpisode}
                  bind:highlight
                />
              {/if}
            {/snippet}
          </PercentageBar>
        </div>

        {#if row.total === 0 && !hidingDetail}
          <p class="row-no-aired">{m.text_progress_no_aired()}</p>
        {:else}
          <ProgressStats
            completed={row.completed}
            total={row.total}
            minutesLeft={row.minutesLeft}
            watched={{ plays: row.plays, minutes: row.minutesWatched }}
          />
        {/if}
        <LastWatchedPill {row} {lastWatchedAt} />
        {@render seasonsControls()}
      </div>
    {/snippet}
  </SeasonsBox>

  <div class="row-card" data-grid-column>
    <ProgressRowCard
      show={row.show}
      {nextEpisode}
      isComplete={isProgressComplete(row)}
    />
  </div>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-progress-row {
    margin-block-end: var(--gutter-half);

    &.is-faded {
      @include watched-fade;
    }

    .row-poster,
    .row-info,
    .row-card {
      margin-block-start: var(--gutter);
    }

    // As tall as its image, so the Dropped badge stays on it as the row grows.
    .row-poster {
      position: relative;
      display: block;
      align-self: start;
    }

    &.is-dropped .row-poster :global(img) {
      filter: var(--filter-dropped);
    }

    .row-info {
      --grid-column-span-tablet: var(--progress-info-column-span-tablet);

      font-size: var(--font-size-small);
      text-align: start;
    }

    .row-card {
      --grid-column-span-tablet: var(--progress-card-column-span-tablet);
      --grid-column-span-desktop: var(--progress-card-column-span-desktop);
    }

    .row-title {
      display: flex;
      column-gap: var(--ni-10);
      align-items: center;
      min-width: var(--ni-0);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-progress-title);
      font-weight: var(--font-weight-heading);
      line-height: var(--line-height-heading);
    }

    .row-name {
      display: flex;
      column-gap: var(--ni-10);
      align-items: center;
      min-width: var(--ni-0);
      max-width: 100%;
    }

    .row-heading {
      display: flex;
      min-width: var(--ni-0);
      margin: var(--ni-0);
      font: inherit;
    }

    .row-show-link {
      @include inherited-link-style;

      position: relative;
      color: var(--color-text-secondary);

      // Drawn inside the box, which the ellipsis clips.
      @include inset-focus-ring;
    }

    .row-year {
      flex-shrink: 0;
      color: var(--color-text-muted);
      font-weight: var(--font-weight-body);
    }

    .row-no-aired {
      margin: var(--ni-0);
    }

    @include for-tablet-sm-and-below {
      .row-poster {
        display: none;
      }
    }

    @include phone-gutterless-cells('.row-card');

    @include for-mobile {
      margin-block-end: var(--ni-0);

      // The status menu takes its own line when the title leaves it no room.
      .row-title {
        flex-wrap: wrap;
        row-gap: var(--ni-5);
      }

      .row-card {
        margin-block-start: var(--ni-0);
      }
    }
  }
</style>
