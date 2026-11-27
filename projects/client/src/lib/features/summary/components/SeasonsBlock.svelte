<script lang="ts">
  import type { PosterGridColumns } from '$lib/components/media/PosterGridProps.ts';
  import EpisodesWatchedBar from '$lib/components/progress/EpisodesWatchedBar.svelte';
  import CountTitle from '$lib/components/text/CountTitle.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import MediaPosterCard from '$lib/features/media-card/components/MediaPosterCard.svelte';
  import UserRatingCorner from '$lib/features/media-card/components/UserRatingCorner.svelte';
  import { toListItemCard } from '$lib/features/media-card/toListItemCard.ts';
  import type { Season } from '$lib/requests/models/Season.ts';
  import { countText } from '$lib/utils/formatting/number/countText.ts';
  import { indexByNumber } from '$lib/utils/media/indexByNumber.ts';
  import { isProgressComplete } from '$lib/utils/media/isProgressComplete.ts';
  import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
  import { SEASONS_SORT } from '../_internal/SEASONS_SORT.ts';
  import { sortSeasons } from '../_internal/sortSeasons.ts';
  import type { SeasonsBlockProps } from './_internal/SeasonsBlockProps.ts';
  import SortableBlock from './_internal/SortableBlock.svelte';

  const COLUMNS = {
    desktop: 5,
    tabletLarge: 4,
    tabletSmall: 3,
    mobile: 2,
  } satisfies PosterGridColumns;

  const SORT = {
    ...SEASONS_SORT,
    labels: {
      number: m.button_text_sort_number,
      rating: m.button_text_sort_rating,
      aired: m.button_text_sort_air_date,
    },
    apply: sortSeasons,
  };

  const GRID = {
    key: (season: Season) => season.key,
    columns: COLUMNS,
  };

  const { show, status, progress, count }: SeasonsBlockProps = $props();

  const progressByNumber = $derived(
    indexByNumber(progress.kind === 'ready' ? progress.data.seasons : []),
  );

  const progressOf = (season: Season) => progressByNumber.get(season.number);

  // Specials stay in view under either filter, whatever their progress reads.
  const isWatched = (season: Season) => {
    const watched = progressOf(season);
    if (!watched || season.number === SPECIALS) return false;
    return isProgressComplete(watched);
  };
</script>

{#snippet title()}
  <CountTitle {count} unit="seasons" />
{/snippet}

<SortableBlock
  {title}
  {status}
  emptyText={m.text_seasons_empty()}
  sort={SORT}
  {isWatched}
  watchedStatus={progress}
  grid={GRID}
>
  {#snippet item(season)}
    {@const watched = progressOf(season)}
    {@const card = toListItemCard({ type: 'season', show, season })}
    {#snippet seasonProgress()}
      {#if watched && watched.completed > 0}
        <EpisodesWatchedBar
          completed={watched.completed}
          total={watched.total}
          size="sm"
        />
      {/if}
    {/snippet}
    <MediaPosterCard
      {card}
      poster={card.poster}
      posterTitle={card.posterTitle}
      progress={seasonProgress}
    >
      {#snippet badges()}
        <UserRatingCorner
          target={{ type: card.target.type, id: card.target.id }}
        />
      {/snippet}
      {#snippet subtitle()}
        {countText.of({ count: season.episodes.count, unit: 'episodes' })}
      {/snippet}
    </MediaPosterCard>
  {/snippet}
</SortableBlock>
