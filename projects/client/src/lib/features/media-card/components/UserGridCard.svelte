<script lang="ts">
  import EpisodeTypeRibbon from '$lib/components/badges/EpisodeTypeRibbon.svelte';
  import type { PosterCardSubtitles } from '$lib/components/media/PosterCardProps.ts';
  import MediaPosterCard from './MediaPosterCard.svelte';
  import UserRatingCorner from './UserRatingCorner.svelte';
  import type { UserGridCardProps } from './UserGridCardProps.ts';

  const {
    card,
    isFaded,
    art,
    droppedAt,
    rank,
    favorite = false,
    historyId,
    playedAt,
    hasPlay,
    tooltipLine,
    ...subtitles
  }: UserGridCardProps = $props();

  // Only an episode has a screenshot; any other card keeps its poster.
  const fanart = $derived(art === 'fanart' ? card.screenshot : undefined);
  const shownSubtitles = $derived<PosterCardSubtitles>(
    fanart
      ? {
        showHref: card.showHref,
        lines: subtitles.lines && [subtitles.lines.at(0)],
      }
      : subtitles,
  );

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
    {tooltipLine}
    {...shownSubtitles}
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
