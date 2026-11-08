<script lang="ts">
  import { useRating } from '$lib/features/media-actions/stores/useRating.ts';
  import UserGridCard from '$lib/features/media-card/components/UserGridCard.svelte';
  import { formatSortValue } from '../formatSortValue.ts';
  import type { ListGridCardProps } from './_internal/ListGridCardProps.ts';
  import SortValue from './SortValue.svelte';

  const {
    entry,
    card,
    droppedAt,
    isFaded,
    sortBy,
    hasRank = false,
    favorite = false,
  }: ListGridCardProps = $props();

  // A grid keys its cards by item, so the target never changes.
  // svelte-ignore state_referenced_locally
  const { rating } = useRating(card.target);

  // A card subscribes to the ratings only once it first shows my_rating.
  const userRating = $derived(sortBy === 'my_rating' ? $rating : undefined);
  const value = $derived(formatSortValue({ item: entry, sortBy, userRating }));
</script>

{#snippet sortLine()}
  <SortValue {value} />
{/snippet}

<UserGridCard
  {card}
  {isFaded}
  {droppedAt}
  rank={hasRank ? entry.rank : undefined}
  {favorite}
  showHref={card.showHref}
  lines={value ? [sortLine] : undefined}
/>
