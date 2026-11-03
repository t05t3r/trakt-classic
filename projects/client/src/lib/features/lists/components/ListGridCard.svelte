<script lang="ts">
  import EpisodeTypeRibbon from '$lib/components/badges/EpisodeTypeRibbon.svelte';
  import MediaPosterCard from '$lib/features/media-card/components/MediaPosterCard.svelte';
  import UserRatingCorner from '$lib/features/media-card/components/UserRatingCorner.svelte';
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

  const ratingTarget = $derived({ type: card.target.type, id: card.target.id });
  // Only SortValue reads the viewer's rating, so a my_rating line stays even if it ends empty.
  const hasSortLine = $derived(
    sortBy === 'my_rating' ||
      formatSortValue({ item: entry, sortBy }) !== undefined,
  );
</script>

{#snippet sortLine()}
  <SortValue item={entry} {sortBy} target={ratingTarget} />
{/snippet}

<div class="trakt-list-grid-card" class:is-faded={isFaded}>
  <MediaPosterCard
    {card}
    poster={card.poster}
    posterTitle={card.posterTitle}
    showHref={card.showHref}
    {droppedAt}
    rank={hasRank ? entry.rank : undefined}
    {favorite}
    lines={[hasSortLine ? sortLine : undefined, undefined]}
  >
    {#snippet badges()}
      {#if card.episodeType}
        <EpisodeTypeRibbon type={card.episodeType} />
      {/if}
      <UserRatingCorner target={ratingTarget} />
    {/snippet}
  </MediaPosterCard>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-list-grid-card.is-faded {
    @include watched-fade;
  }
</style>
