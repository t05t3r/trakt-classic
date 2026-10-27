<script lang="ts">
  import { resolve } from '$app/paths';
  import EpisodeTypeTag from '$lib/components/badges/EpisodeTypeTag.svelte';
  import { hasEpisodeTypeTag } from '$lib/components/badges/hasEpisodeTypeTag.ts';
  import NeighbourLinks from '$lib/components/pagination/NeighbourLinks.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import ActionColumn from '$lib/features/media-actions/components/ActionColumn.svelte';
  import type { RatingStoreProps } from '$lib/features/media-actions/stores/useRating.ts';
  import { toMediaCard } from '$lib/features/media-card/toMediaCard.ts';
  import CastBlock from '$lib/features/summary/components/CastBlock.svelte';
  import ListsBlock from '$lib/features/summary/components/ListsBlock.svelte';
  import { useEpisode } from '$lib/features/summary/stores/useEpisode.ts';
  import { countText } from '$lib/utils/formatting/number/countText.ts';
  import { episodeSxeLabel } from '$lib/utils/intl/episodeSxeLabel.ts';
  import { seasonLabel } from '$lib/utils/intl/seasonLabel.ts';
  import { fromRune } from '$lib/utils/store/fromRune.svelte.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import type { EpisodePageProps } from './_internal/EpisodePageProps.ts';
  import SummaryComments from './_internal/SummaryComments.svelte';
  import SummaryOverview from './_internal/SummaryOverview.svelte';
  import { toEpisodeStatsRows } from './_internal/toEpisodeStatsRows.ts';
  import { toExternalLinks } from './_internal/toExternalLinks.ts';
  import { toSwitcherEntries } from './_internal/toSwitcherEntries.ts';
  import type { InfoSection } from './InfoSection.ts';
  import MobilePoster from './MobilePoster.svelte';
  import SeasonSwitcher from './SeasonSwitcher.svelte';
  import SummaryHero from './SummaryHero.svelte';
  import SummaryInfo from './SummaryInfo.svelte';
  import SummaryRatings from './SummaryRatings.svelte';

  const { slug, season, episode: episodeNumber }: EpisodePageProps = $props();

  const {
    episode,
    show,
    year,
    backdrop,
    seasonPoster,
    stats,
    commentsStatus,
    crew,
    castStatus,
    ratings: episodeRatings,
    earliestReleaseDate,
    episodes,
    neighbours: episodeNeighbours,
    listsStatus,
  } = useEpisode(
    fromRune(() => ({ slug, season, episode: episodeNumber })),
  );

  const seasonHref = $derived(UrlBuilder.season(slug, season));

  // The season's corner waits for its id, which only the seasons read gives.
  const seasonRatingTarget: RatingStoreProps | undefined = $derived(
    $seasonPoster.seasonId === undefined
      ? undefined
      : { type: 'season', id: $seasonPoster.seasonId },
  );

  const posterTitle = $derived(seasonLabel(season, $show?.title));

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

  const pageTitle = $derived.by(() => {
    if (!$episode || !$show) return;

    const sxe = episodeSxeLabel($episode);
    if (!$episode.title) {
      return m.page_title_episode_untitled({ show: $show.title, sxe });
    }

    return m.page_title_episode({
      show: $show.title,
      sxe,
      title: $episode.title,
    });
  });
</script>

<svelte:head>
  {#if pageTitle}
    <title>{pageTitle} · {m.text_app_name()}</title>
  {/if}
</svelte:head>

{#snippet breadcrumb()}
  {#if $show}
    <a href={resolve(UrlBuilder.show(slug))}>{m.text_breadcrumb_show({ show: $show.title })}</a>
    <a href={resolve(seasonHref)}>{seasonLabel(season)}</a>
  {/if}
{/snippet}

{#snippet premiere()}
  {#if $episode}
    <EpisodeTypeTag type={$episode.type} />
  {/if}
{/snippet}

{#snippet neighbours()}
  <NeighbourLinks
    {...$episodeNeighbours}
    previousLabel={m.button_label_previous_episode()}
    nextLabel={m.button_label_next_episode()}
  />
{/snippet}

{#snippet switcher()}
  <SeasonSwitcher
    label={m.label_switcher_episode()}
    entries={toSwitcherEntries({
      type: 'episode',
      slug,
      season,
      episodes: $episodes,
      current: episodeNumber,
    })}
  />
{/snippet}

{#snippet overviewContent()}
  {#if $episode && $show}
    <!-- Keyed, so the next episode's overview starts clamped and its column gets its own Target. -->
    {#key $episode.id}
      <SummaryOverview
        rows={toEpisodeStatsRows({ episode: $episode, show: $show, crew: $crew })}
        overview={$episode.overview}
      >
        {#snippet actions()}
          <ActionColumn
            target={toMediaCard({ type: 'episode', episode: $episode, show: $show }).target}
          />
        {/snippet}
      </SummaryOverview>
    {/key}
  {/if}
{/snippet}

{#snippet actorsContent()}
  <CastBlock status={$castStatus} />
{/snippet}

{#snippet commentsContent()}
  <SummaryComments status={$commentsStatus} />
{/snippet}

{#snippet listsContent()}
  <ListsBlock status={$listsStatus} />
{/snippet}

{#if $episode && $show}
  <div class="trakt-episode-page">
    <SummaryHero
      backdrop={$backdrop}
      title={$episode.title}
      sxe={episodeSxeLabel($episode)}
      year={$year}
      yearZoned
      certification={$show.certification}
      {breadcrumb}
      premiere={hasEpisodeTypeTag($episode.type) ? premiere : undefined}
      {neighbours}
    >
      {#snippet poster()}
        <MobilePoster
          poster={$seasonPoster.src}
          href={seasonHref}
          title={posterTitle}
          ratingTarget={seasonRatingTarget}
        />
      {/snippet}
      {#snippet ratings()}
        <SummaryRatings
          type="episode"
          id={$episode.id}
          rating={$episodeRatings}
          stats={$stats}
          earliestReleaseDate={$earliestReleaseDate}
        />
      {/snippet}
    </SummaryHero>
    <SummaryInfo
      poster={{
        src: $seasonPoster.src,
        title: posterTitle,
        href: seasonHref,
        ratingTarget: seasonRatingTarget,
      }}
      links={toExternalLinks({
        type: 'episode',
        imdbId: $episode.imdbId,
        tmdbId: $show.tmdbId,
        season: $episode.season,
        episode: $episode.number,
      })}
      {sections}
      {switcher}
    />
  </div>
{/if}
