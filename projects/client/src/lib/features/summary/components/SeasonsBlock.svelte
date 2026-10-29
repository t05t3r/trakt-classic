<script lang="ts">
  import type { PosterGridColumns } from '$lib/components/media/PosterGridProps.ts';
  import TickProgressBar from '$lib/components/progress/TickProgressBar.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import MediaPosterCard from '$lib/features/media-card/components/MediaPosterCard.svelte';
  import UserRatingCorner from '$lib/features/media-card/components/UserRatingCorner.svelte';
  import { toMediaCard } from '$lib/features/media-card/toMediaCard.ts';
  import type { Season } from '$lib/requests/models/Season.ts';
  import { countText } from '$lib/utils/formatting/number/countText.ts';
  import { isProgressComplete } from '$lib/utils/media/isProgressComplete.ts';
  import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
  import { SEASONS_SORT } from '../_internal/SEASONS_SORT.ts';
  import { sortSeasons } from '../_internal/sortSeasons.ts';
  import CountTitle from './_internal/CountTitle.svelte';
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
    new Map(progress?.seasons.map((season) => [season.number, season])),
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
  grid={GRID}
>
  {#snippet item(season)}
    {@const watched = progressOf(season)}
    {@const card = toMediaCard({ type: 'season', show, season })}
    {#snippet seasonProgress()}
      {#if watched && watched.completed > 0}
        {@const progressLabel = m.progress_label_episodes_watched({
          completed: watched.completed,
          total: watched.total,
        })}
        <TickProgressBar
          value={watched.completed}
          total={watched.total}
          size="sm"
          label={progressLabel}
        />
      {/if}
    {/snippet}
    <MediaPosterCard
      {card}
      poster={season.poster ?? show.poster}
      posterTitle={show.title}
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
