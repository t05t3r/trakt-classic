<script lang="ts">
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

  // Only SortValue reads the viewer's rating, so a my_rating line stays even if it ends empty.
  const hasSortLine = $derived(
    sortBy === 'my_rating' ||
      formatSortValue({ item: entry, sortBy }) !== undefined,
  );
</script>

{#snippet sortLine()}
  <SortValue item={entry} {sortBy} target={card.target} />
{/snippet}

<UserGridCard
  {card}
  {isFaded}
  showHref={card.showHref}
  {droppedAt}
  rank={hasRank ? entry.rank : undefined}
  {favorite}
  lines={[hasSortLine ? sortLine : undefined, undefined]}
/>
