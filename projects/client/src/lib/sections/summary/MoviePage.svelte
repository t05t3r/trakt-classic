<script lang="ts">
  import { resolve } from '$app/paths';
  import * as m from '$lib/features/i18n/messages.ts';
  import ActionColumn from '$lib/features/media-actions/components/ActionColumn.svelte';
  import { toMediaCard } from '$lib/features/media-card/toMediaCard.ts';
  import CastBlock from '$lib/features/summary/components/CastBlock.svelte';
  import ListsBlock from '$lib/features/summary/components/ListsBlock.svelte';
  import { useMovie } from '$lib/features/summary/stores/useMovie.ts';
  import { countText } from '$lib/utils/formatting/number/countText.ts';
  import { fromRune } from '$lib/utils/store/fromRune.svelte.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import RelatedBlock from './_internal/RelatedBlock.svelte';
  import SummaryComments from './_internal/SummaryComments.svelte';
  import SummaryOverview from './_internal/SummaryOverview.svelte';
  import { toExternalLinks } from './_internal/toExternalLinks.ts';
  import { toMovieStatsRows } from './_internal/toMovieStatsRows.ts';
  import type { InfoSection } from './InfoSection.ts';
  import MobilePoster from './MobilePoster.svelte';
  import SummaryHero from './SummaryHero.svelte';
  import SummaryRatings from './SummaryRatings.svelte';
  import SummaryInfo from './SummaryInfo.svelte';

  const { slug }: { slug: string } = $props();

  const {
    movie,
    officialList,
    stats,
    commentsStatus,
    castStatus,
    crew,
    studios,
    ratings: movieRatings,
    earliestReleaseDate,
    relatedStatus,
    listsStatus,
  } = useMovie(fromRune(() => slug));

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
    if (!$movie) return;
    if ($movie.year == null) return $movie.title;

    return m.page_title_movie({ title: $movie.title, year: $movie.year });
  });
</script>

<svelte:head>
  {#if pageTitle}
    <title>{pageTitle} · {m.text_app_name()}</title>
  {/if}
</svelte:head>

{#snippet officialListCrumb()}
  {#if $officialList}
    <a href={resolve(UrlBuilder.lists.official($officialList.slug))}>{$officialList.name}</a>
  {/if}
{/snippet}

{#snippet overviewContent()}
  {#if $movie}
    <!-- Keyed, so the next movie's overview starts clamped. -->
    {#key $movie.id}
      <SummaryOverview
        rows={toMovieStatsRows({ movie: $movie, crew: $crew, studios: $studios })}
        tagline={$movie.tagline}
        overview={$movie.overview}
        trailer={$movie.trailer}
      >
        {#snippet actions()}
          <ActionColumn
            target={toMediaCard({ type: 'movie', movie: $movie }).target}
            favorite
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

{#if $movie}
  <div class="trakt-movie-page">
    <SummaryHero
      backdrop={$movie.cover.url.full}
      title={$movie.title}
      year={$movie.year}
      certification={$movie.certification}
      breadcrumb={$officialList ? officialListCrumb : undefined}
    >
      {#snippet poster()}
        <MobilePoster
          poster={$movie.poster.url.thumb}
          title={$movie.title}
          ratingTarget={{ type: 'movie', id: $movie.id }}
        />
      {/snippet}
      {#snippet ratings()}
        <SummaryRatings
          type="movie"
          id={$movie.id}
          rating={$movieRatings}
          stats={$stats}
          earliestReleaseDate={$earliestReleaseDate}
        />
      {/snippet}
    </SummaryHero>
    <SummaryInfo
      poster={{
        src: $movie.poster.url.thumb,
        title: $movie.title,
        ratingTarget: { type: 'movie', id: $movie.id },
      }}
      links={toExternalLinks({ ...$movie, type: 'movie' })}
      {sections}
    />
    <RelatedBlock title={$movie.title} status={$relatedStatus} />
  </div>
{/if}
