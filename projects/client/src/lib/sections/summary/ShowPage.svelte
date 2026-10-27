<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import ActionColumn from '$lib/features/media-actions/components/ActionColumn.svelte';
  import { toMediaCard } from '$lib/features/media-card/toMediaCard.ts';
  import CastBlock from '$lib/features/summary/components/CastBlock.svelte';
  import ListsBlock from '$lib/features/summary/components/ListsBlock.svelte';
  import RecentEpisodesBlock from '$lib/features/summary/components/RecentEpisodesBlock.svelte';
  import SeasonsBlock from '$lib/features/summary/components/SeasonsBlock.svelte';
  import { useRecentEpisodes } from '$lib/features/summary/stores/useRecentEpisodes.ts';
  import { useShow } from '$lib/features/summary/stores/useShow.ts';
  import { countText } from '$lib/utils/formatting/number/countText.ts';
  import { fromRune } from '$lib/utils/store/fromRune.svelte.ts';
  import RelatedBlock from './_internal/RelatedBlock.svelte';
  import SummaryComments from './_internal/SummaryComments.svelte';
  import SummaryOverview from './_internal/SummaryOverview.svelte';
  import { toExternalLinks } from './_internal/toExternalLinks.ts';
  import { toShowStatsRows } from './_internal/toShowStatsRows.ts';
  import type { InfoSection } from './InfoSection.ts';
  import MobilePoster from './MobilePoster.svelte';
  import SummaryHero from './SummaryHero.svelte';
  import SummaryRatings from './SummaryRatings.svelte';
  import SummaryInfo from './SummaryInfo.svelte';

  const { slug }: { slug: string } = $props();

  const {
    show,
    stats,
    commentsStatus,
    castStatus,
    crew,
    studios,
    seasonsStatus,
    seasonCount,
    progress,
    progressStatus,
    ratings: showRatings,
    earliestReleaseDate,
    relatedStatus,
    listsStatus,
  } = useShow(fromRune(() => slug));
  const recentEpisodesStatus = useRecentEpisodes(fromRune(() => slug));

  // In from mount, so a #recent-episodes hash finds its block; out once nothing has aired.
  const recentEpisodesSection: ReadonlyArray<InfoSection> = $derived(
    $recentEpisodesStatus.kind === 'empty' ? [] : [{
      id: 'recent-episodes',
      label: m.text_sidebar_recent_episodes(),
      content: recentEpisodesContent,
    }],
  );

  // In from mount, so a #seasons hash finds its block; out once the show has no seasons.
  const seasonsSection: ReadonlyArray<InfoSection> = $derived(
    $seasonsStatus.kind === 'empty' ? [] : [{
      id: 'seasons',
      label: countText.word({ count: $seasonCount, unit: 'seasons' }),
      count: $seasonCount,
      content: seasonsContent,
    }],
  );

  const sections: ReadonlyArray<InfoSection> = $derived([
    {
      id: 'overview',
      label: m.text_sidebar_overview(),
      content: overviewContent,
    },
    ...recentEpisodesSection,
    {
      id: 'actors',
      label: m.list_title_actors(),
      content: actorsContent,
    },
    ...seasonsSection,
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
  {#if $show}
    <title>{m.page_title_show({ title: $show.title })} · {m.text_app_name()}</title>
  {/if}
</svelte:head>

{#snippet overviewContent()}
  {#if $show}
    <!-- Keyed, so the next show's overview starts clamped. -->
    {#key $show.id}
      <SummaryOverview
        rows={toShowStatsRows({ show: $show, crew: $crew, studios: $studios })}
        overview={$show.overview}
        trailer={$show.trailer}
      >
        {#snippet actions()}
          <ActionColumn
            target={toMediaCard({ type: 'show', show: $show }).target}
            progress={$progressStatus}
            favorite
          />
        {/snippet}
      </SummaryOverview>
    {/key}
  {/if}
{/snippet}

{#snippet recentEpisodesContent()}
  {#if $show}
    <RecentEpisodesBlock show={$show} status={$recentEpisodesStatus} />
  {/if}
{/snippet}

{#snippet actorsContent()}
  <CastBlock status={$castStatus} />
{/snippet}

{#snippet seasonsContent()}
  {#if $show}
    <SeasonsBlock
      show={$show}
      status={$seasonsStatus}
      progress={$progress}
      count={$seasonCount}
    />
  {/if}
{/snippet}

{#snippet commentsContent()}
  <SummaryComments status={$commentsStatus} />
{/snippet}

{#snippet listsContent()}
  <ListsBlock status={$listsStatus} />
{/snippet}

{#if $show}
  <div class="trakt-show-page">
    <SummaryHero
      backdrop={$show.cover.url.full}
      title={$show.title}
      year={$show.year}
      certification={$show.certification}
    >
      {#snippet poster()}
        <MobilePoster
          poster={$show.poster.url.thumb}
          title={$show.title}
          ratingTarget={{ type: 'show', id: $show.id }}
        />
      {/snippet}
      {#snippet ratings()}
        <SummaryRatings
          type="show"
          id={$show.id}
          rating={$showRatings}
          stats={$stats}
          earliestReleaseDate={$earliestReleaseDate}
        />
      {/snippet}
    </SummaryHero>
    <SummaryInfo
      poster={{
        src: $show.poster.url.thumb,
        title: $show.title,
        ratingTarget: { type: 'show', id: $show.id },
      }}
      links={toExternalLinks({ ...$show, type: 'show' })}
      {sections}
    />
    <RelatedBlock title={$show.title} status={$relatedStatus} />
  </div>
{/if}
