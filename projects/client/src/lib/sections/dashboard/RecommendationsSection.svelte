<script lang="ts">
  import type { Pathname } from '$app/types';
  import SectionState from '$lib/components/feedback/SectionState.svelte';
  import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
  import SeeMoreLink from '$lib/components/headers/SeeMoreLink.svelte';
  import { combineReveals } from '$lib/components/pagination/combineReveals.ts';
  import LoadMore from '$lib/components/pagination/LoadMore.svelte';
  import type { RowReveal } from '$lib/components/pagination/RowReveal.ts';
  import RowRevealGrid from '$lib/components/pagination/RowRevealGrid.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import {
    type HideTarget,
    useHideRecommendation,
  } from '$lib/features/media-actions/stores/useHideRecommendation.ts';
  import MediaPosterCard from '$lib/features/media-card/components/MediaPosterCard.svelte';
  import {
    type MediaCard,
    toMediaCard,
  } from '$lib/features/media-card/toMediaCard.ts';
  import { toSectionStatus } from '$lib/features/query/toSectionStatus.ts';
  import { useQuery } from '$lib/features/query/useQuery.ts';
  import RenderFor from '$lib/guards/RenderFor.svelte';
  import type { MediaEntry } from '$lib/requests/models/MediaEntry.ts';
  import {
    type RecommendedMovie,
    recommendedMoviesQuery,
  } from '$lib/requests/queries/recommendations/recommendedMoviesQuery.ts';
  import {
    type RecommendedShow,
    recommendedShowsQuery,
  } from '$lib/requests/queries/recommendations/recommendedShowsQuery.ts';
  import { useRowCount } from '$lib/stores/useRowCount.ts';
  import { isEmpty } from '$lib/utils/array/isEmpty.ts';
  import { createFocusRetention } from '$lib/utils/focus/createFocusRetention.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import type { Icon } from '@tabler/icons-svelte';
  import IconBan from '@tabler/icons-svelte/icons/ban';
  import IconDeviceTvOld from '@tabler/icons-svelte/icons/device-tv-old';
  import IconMovie from '@tabler/icons-svelte/icons/movie';
  import type { Attachment } from 'svelte/attachments';

  type RecommendationCard = MediaCard<'show' | 'movie'> & {
    entry: MediaEntry;
    hideTarget: HideTarget;
  };

  type RecommendationColumn = {
    title: string;
    icon: Icon;
    seeMore: { href: Pathname; context: string };
    status: SectionStatus<ReadonlyArray<RecommendationCard>>;
    reveal: {
      get: () => RowReveal | undefined;
      set: (reveal: RowReveal | undefined) => void;
    };
    isShown: boolean;
  };

  const ROW_MAX = 4;
  const DEFAULT_ROW_COUNT = 2;
  const COLUMNS = { desktop: 3, tablet: 2, mobile: 2 };
  // Every row a column can open, so nothing fetches on "more".
  const LIMIT = ROW_MAX * COLUMNS.desktop;

  const showsQuery = useQuery(recommendedShowsQuery({ limit: LIMIT }));
  const moviesQuery = useQuery(recommendedMoviesQuery({ limit: LIMIT }));
  const { isHidden, hide } = useHideRecommendation();

  const { rowCount, setRowCount } = useRowCount({
    key: 'recommendations',
    rowMax: ROW_MAX,
    defaultCount: DEFAULT_ROW_COUNT,
  });

  const showCard = (entry: RecommendedShow): RecommendationCard => ({
    ...toMediaCard({ type: 'show', show: entry }),
    entry,
    hideTarget: { type: 'show', id: entry.id, slug: entry.slug },
  });

  const movieCard = (entry: RecommendedMovie): RecommendationCard => ({
    ...toMediaCard({ type: 'movie', movie: entry }),
    entry,
    hideTarget: { type: 'movie', id: entry.id, slug: entry.slug },
  });

  const showsStatus = $derived(
    toSectionStatus({
      result: $showsQuery,
      select: (entries) =>
        entries.map(showCard).filter((card) => !$isHidden(card.hideTarget)),
      isEmpty,
    }),
  );
  const moviesStatus = $derived(
    toSectionStatus({
      result: $moviesQuery,
      select: (entries) =>
        entries.map(movieCard).filter((card) => !$isHidden(card.hideTarget)),
      isEmpty,
    }),
  );

  let showsReveal = $state<RowReveal>();
  let moviesReveal = $state<RowReveal>();

  // A grid that left keeps its last report, so only a ready column's counts.
  const whileReady = (
    status: SectionStatus<unknown>,
    reveal: RowReveal | undefined,
  ) => (status.kind === 'ready' ? reveal : undefined);

  const isNavigable = (reveal: RowReveal | undefined) =>
    reveal != null && (reveal.showLess || reveal.showMore);

  const showsShown = $derived(whileReady(showsStatus, showsReveal));
  const moviesShown = $derived(whileReady(moviesStatus, moviesReveal));
  const combined = $derived(combineReveals([showsShown, moviesShown]));
  const hasNavigator = $derived(isNavigable(combined));

  // A navigator that leaves with the focus hands it to its fallback.
  const holdFocusOnLeave = (
    findFallback: (navigator: HTMLElement) => HTMLElement | Nil,
  ): Attachment<HTMLElement> => (navigator) => {
    // Found now, since a navigator that left no longer finds its column.
    const fallback = findFallback(navigator);
    const retention = createFocusRetention();
    const untrack = retention.track(navigator);

    return () => {
      untrack();
      retention.settle(fallback);
    };
  };

  const columnSection = (navigator: HTMLElement) =>
    navigator
      .closest('.recommendations-column')
      ?.querySelector<HTMLElement>(':scope > section');

  // The shared pill spans both columns, so the first column's section takes its focus.
  const firstColumnSection = (navigator: HTMLElement) =>
    navigator
      .closest('.trakt-recommendations-section')
      ?.querySelector<HTMLElement>('.recommendations-column > section');
</script>

{#snippet helpText()}
  {m.text_dashboard_help_recommendations()}
{/snippet}

{#snippet card(recommendation: RecommendationCard)}
  {@const { entry, hideTarget } = recommendation}
  <MediaPosterCard
    card={recommendation}
    poster={entry.poster}
    posterTitle={entry.title}
  >
    {#snippet subtitle()}
      <button
        type="button"
        class="recommendations-hide"
        aria-label={m.button_label_hide_recommendation({ title: entry.title })}
        onclick={() => void hide(hideTarget)}
      >
        <IconBan
          class="recommendations-hide-glyph trakt-icon-mirrored"
          aria-hidden="true"
        />
        {m.button_text_hide()}
      </button>
    {/snippet}
  </MediaPosterCard>
{/snippet}

{#snippet stepper()}
  {#if combined}
    {@const { openRows, showLess, showMore } = combined}
    <LoadMore
      variant="dark"
      {showLess}
      {showMore}
      onless={() => setRowCount(openRows - 1)}
      onmore={() => setRowCount(openRows + 1)}
    />
  {/if}
{/snippet}

{#snippet column(
  { title, icon, seeMore, status, reveal, isShown }: RecommendationColumn,
)}
  {#snippet seeMoreLink()}
    <SeeMoreLink
      href={seeMore.href}
      label={m.button_text_view_all()}
      context={seeMore.context}
    />
  {/snippet}

  <div
    class="recommendations-column"
    class:has-navigator={isShown && hasNavigator}
  >
    <SectionState
      header={{
        title,
        icon,
        helpText,
        helpTextGap: 'compact',
        tools: seeMoreLink,
      }}
      {status}
      emptyText={m.text_dashboard_empty_recommendations()}
    >
      {#snippet children(cards)}
        <RowRevealGrid
          items={cards}
          key={(recommendation) => recommendation.entry.key}
          columns={COLUMNS}
          rowMax={ROW_MAX}
          bind:rowCount={() => $rowCount, setRowCount}
          bind:reveal={reveal.get, reveal.set}
          navigator="none"
          variant="posters"
          bottomGap="none"
          phoneRows="mobile"
          phoneCellGap="none"
        >
          {#snippet item(recommendation)}
            {@render card(recommendation)}
          {/snippet}
        </RowRevealGrid>
      {/snippet}
    </SectionState>

    {#if isShown && hasNavigator}
      <RenderFor audience="all" device={['mobile']}>
        <div
          class="recommendations-phone-navigator"
          {@attach holdFocusOnLeave(columnSection)}
        >
          {@render stepper()}
        </div>
      </RenderFor>
    {/if}
  </div>
{/snippet}

<div class="trakt-recommendations-section">
  <div class="recommendations-columns">
    {@render column({
      title: m.text_dashboard_title_show_recommendations(),
      icon: IconDeviceTvOld,
      seeMore: {
        href: UrlBuilder.recommended('show'),
        context: m.button_label_more_show_recommendations_context(),
      },
      status: showsStatus,
      reveal: {
        get: () => showsReveal,
        set: (reveal) => (showsReveal = reveal),
      },
      isShown: showsShown != null,
    })}
    {@render column({
      title: m.text_dashboard_title_movie_recommendations(),
      icon: IconMovie,
      seeMore: {
        href: UrlBuilder.recommended('movie'),
        context: m.button_label_more_movie_recommendations_context(),
      },
      status: moviesStatus,
      reveal: {
        get: () => moviesReveal,
        set: (reveal) => (moviesReveal = reveal),
      },
      isShown: moviesShown != null,
    })}
  </div>

  {#if hasNavigator}
    <RenderFor audience="all" device={['tablet-sm', 'tablet-lg', 'desktop']}>
      <div
        class="recommendations-shared-navigator"
        {@attach holdFocusOnLeave(firstColumnSection)}
      >
        {@render stepper()}
      </div>
    </RenderFor>
  {/if}
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-recommendations-section {
    --load-more-offset: var(--ni-8);

    // Centres the shared pill, which takes no room and overhangs the bottom edge.
    position: relative;

    .recommendations-columns {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--gutter);
    }

    @include for-mobile {
      .recommendations-columns {
        grid-template-columns: minmax(0, 1fr);
        gap: var(--ni-0);
      }

      // Centres the column's phone pill, which sits out of flow.
      .recommendations-column {
        position: relative;
      }

      // The phone pill takes no room, so its room and offset are reserved under it.
      .recommendations-column.has-navigator {
        padding-block-end: var(--recommendations-navigator-room);
      }
    }

    // A button sets its own font and colour, so it takes the subtitle's muted text.
    .recommendations-hide {
      display: inline-flex;
      align-items: center;
      vertical-align: top;
      padding: var(--ni-0);
      border: none;
      background: none;
      color: inherit;
      font: inherit;
      cursor: pointer;

      :global(.recommendations-hide-glyph) {
        flex-shrink: 0;
        width: var(--icon-size-title-row);
        height: var(--icon-size-title-row);
        margin-inline-end: var(--ni-5);
        stroke-width: var(--icon-stroke-chrome);
      }

      @include for-mouse {
        &:hover {
          color: var(--color-text-primary);
        }
      }
    }
  }
</style>
