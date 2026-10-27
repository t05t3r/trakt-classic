<script lang="ts">
  import { resolve } from '$app/paths';
  import NeighbourLinks from '$lib/components/pagination/NeighbourLinks.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import ActionColumn from '$lib/features/media-actions/components/ActionColumn.svelte';
  import type { RatingStoreProps } from '$lib/features/media-actions/stores/useRating.ts';
  import { toMediaCard } from '$lib/features/media-card/toMediaCard.ts';
  import CastBlock from '$lib/features/summary/components/CastBlock.svelte';
  import EpisodesBlock from '$lib/features/summary/components/EpisodesBlock.svelte';
  import ListsBlock from '$lib/features/summary/components/ListsBlock.svelte';
  import {
    type SeasonParams,
    useSeason,
  } from '$lib/features/summary/stores/useSeason.ts';
  import { countText } from '$lib/utils/formatting/number/countText.ts';
  import { seasonLabel } from '$lib/utils/intl/seasonLabel.ts';
  import { fromRune } from '$lib/utils/store/fromRune.svelte.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import SummaryComments from './_internal/SummaryComments.svelte';
  import SummaryOverview from './_internal/SummaryOverview.svelte';
  import { toExternalLinks } from './_internal/toExternalLinks.ts';
  import { toSeasonStatsRows } from './_internal/toSeasonStatsRows.ts';
  import { toSwitcherEntries } from './_internal/toSwitcherEntries.ts';
  import type { InfoSection } from './InfoSection.ts';
  import MobilePoster from './MobilePoster.svelte';
  import SeasonSwitcher from './SeasonSwitcher.svelte';
  import SummaryHero from './SummaryHero.svelte';
  import SummaryInfo from './SummaryInfo.svelte';
  import SummaryRatings from './SummaryRatings.svelte';

  const { slug, season: seasonNumber }: SeasonParams = $props();

  const {
    season,
    show,
    year,
    poster: seasonPoster,
    ratings: seasonRatings,
    stats,
    commentsStatus,
    castStatus,
    episodesStatus,
    episodeCount,
    progressStatus,
    seasons,
    neighbours: seasonNeighbours,
    listsStatus,
  } = useSeason(fromRune(() => ({ slug, season: seasonNumber })));

  const showHref = $derived(UrlBuilder.show(slug));

  const seasonRatingTarget: RatingStoreProps | undefined = $derived(
    $season ? { type: 'season', id: $season.id } : undefined,
  );

  const title = $derived(seasonLabel(seasonNumber));
  const posterTitle = $derived(seasonLabel(seasonNumber, $show?.title));

  const sections: ReadonlyArray<InfoSection> = $derived([
    {
      id: 'overview',
      label: m.text_sidebar_overview(),
      content: overviewContent,
    },
    {
      id: 'actors',
      label: m.list_title_actors(),
      content: actorsContent,
    },
    {
      id: 'episodes',
      label: countText.word({ count: $episodeCount, unit: 'episodesTitle' }),
      count: $episodeCount,
      content: episodesContent,
    },
    {
      id: 'comments',
      label: countText.word({ count: $stats?.comments, unit: 'comments' }),
      count: $stats?.comments,
      content: commentsContent,
    },
    {
      id: 'lists',
      label: m.page_title_lists(),
      count: $stats?.lists,
      content: listsContent,
    },
  ]);
</script>

<svelte:head>
  {#if $season && $show}
    <title>{m.page_title_season({ show: $show.title, season: title })} · {m.text_app_name()}</title>
  {/if}
</svelte:head>

{#snippet breadcrumb()}
  {#if $show}
    <a href={resolve(showHref)}>{$show.title}</a>
  {/if}
{/snippet}

{#snippet overviewContent()}
  {#if $season && $show}
    <!-- Keyed, so the next season's overview starts clamped and its column gets its own Target. -->
    {#key $season.id}
      <SummaryOverview
        rows={toSeasonStatsRows({ season: $season, show: $show })}
        overview={$season.overview ?? ''}
      >
        {#snippet actions()}
          <ActionColumn
            target={toMediaCard({ type: 'season', show: $show, season: $season }).target}
            progress={$progressStatus}
          />
        {/snippet}
      </SummaryOverview>
    {/key}
  {/if}
{/snippet}

{#snippet neighbours()}
  <NeighbourLinks
    {...$seasonNeighbours}
    previousLabel={m.button_label_previous_season()}
    nextLabel={m.button_label_next_season()}
  />
{/snippet}

{#snippet switcher()}
  <SeasonSwitcher
    label={m.label_switcher_season()}
    entries={toSwitcherEntries({
      type: 'season',
      slug,
      seasons: $seasons,
      current: seasonNumber,
    })}
  />
{/snippet}

{#snippet actorsContent()}
  <CastBlock status={$castStatus} />
{/snippet}

{#snippet episodesContent()}
  {#if $show}
    <EpisodesBlock
      show={$show}
      status={$episodesStatus}
      count={$episodeCount}
    />
  {/if}
{/snippet}

{#snippet commentsContent()}
  <SummaryComments status={$commentsStatus} />
{/snippet}

{#snippet listsContent()}
  <ListsBlock status={$listsStatus} />
{/snippet}

{#if $season && $show}
  <div class="trakt-season-page">
    <SummaryHero
      backdrop={$show.cover.url.full}
      {title}
      year={$year}
      yearZoned
      certification={$show.certification}
      {breadcrumb}
      {neighbours}
    >
      {#snippet poster()}
        <MobilePoster
          poster={$seasonPoster}
          href={showHref}
          title={posterTitle}
          ratingTarget={seasonRatingTarget}
        />
      {/snippet}
      {#snippet ratings()}
        <SummaryRatings
          type="season"
          id={$season.id}
          rating={$seasonRatings}
          stats={$stats}
          earliestReleaseDate={$season.airDate}
        />
      {/snippet}
    </SummaryHero>
    <SummaryInfo
      poster={{
        src: $seasonPoster,
        title: posterTitle,
        href: showHref,
        ratingTarget: seasonRatingTarget,
      }}
      links={toExternalLinks({
        type: 'season',
        imdbId: $show.imdbId,
        tmdbId: $show.tmdbId,
        season: $season.number,
      })}
      {sections}
      {switcher}
    />
  </div>
{/if}
