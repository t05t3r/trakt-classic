<script lang="ts">
  import EpisodeTypeRibbon from '$lib/components/badges/EpisodeTypeRibbon.svelte';
  import MediaPosterCard from './MediaPosterCard.svelte';
  import UserRatingCorner from './UserRatingCorner.svelte';
  import type { UserGridCardProps } from './UserGridCardProps.ts';

  const {
    card,
    isFaded,
    fanart,
    droppedAt,
    rank,
    favorite = false,
    historyId,
    playedAt,
    hasPlay,
    ...subtitles
  }: UserGridCardProps = $props();

  const ratingTarget = $derived({ type: card.target.type, id: card.target.id });
</script>

<div class="trakt-user-grid-card" class:is-faded={isFaded}>
  <MediaPosterCard
    {card}
    poster={card.poster}
    posterTitle={card.posterTitle}
    {fanart}
    {droppedAt}
    {rank}
    {favorite}
    {historyId}
    {playedAt}
    {hasPlay}
    {...subtitles}
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

  .trakt-user-grid-card.is-faded {
    @include watched-fade;
  }
</style>
