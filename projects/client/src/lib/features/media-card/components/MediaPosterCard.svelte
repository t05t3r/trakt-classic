<script lang="ts">
  import RankBadge from '$lib/components/badges/RankBadge.svelte';
  import PosterCard from '$lib/components/media/PosterCard.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import LazyImage from '$lib/features/image/components/LazyImage.svelte';
  import QuickActions from '$lib/features/media-actions/components/QuickActions.svelte';
  import { isKnownDate } from '$lib/utils/date/isKnownDate.ts';
  import CardCommunityRating from './CardCommunityRating.svelte';
  import type { MediaPosterCardProps } from './MediaPosterCardProps.ts';

  const {
    card,
    poster,
    posterTitle,
    fanart,
    droppedAt,
    rank,
    favorite,
    historyId,
    playedAt,
    hasPlay,
    badges,
    progress,
    ...subtitles
  }: MediaPosterCardProps = $props();

  const shownDroppedAt = $derived(
    card.media.type === 'show' && droppedAt && isKnownDate(droppedAt)
      ? droppedAt
      : undefined,
  );
</script>

{#snippet rankBadge()}
  {#if rank !== undefined}
    <RankBadge {rank} />
  {/if}
{/snippet}

<PosterCard
  media={card.media}
  href={card.href}
  droppedAt={shownDroppedAt}
  rank={rank === undefined ? undefined : rankBadge}
  {badges}
  {progress}
  {...subtitles}
>
  {#snippet image()}
    {#if fanart}
      <LazyImage src={fanart.src} alt={fanart.alt} kind="fanart" />
    {:else}
      <LazyImage
        src={poster.url.thumb}
        alt={m.image_alt_media_poster({ title: posterTitle })}
        kind="poster"
      />
    {/if}
  {/snippet}
  {#snippet actions()}
    <QuickActions
      target={card.target}
      size="smaller"
      {favorite}
      {historyId}
      {playedAt}
      {hasPlay}
    >
      {#snippet metadata(hasPlayRead)}
        <CardCommunityRating
          rating={card.rating}
          target={card.target}
          hasPlay={hasPlayRead}
          variant="smaller"
        />
      {/snippet}
    </QuickActions>
  {/snippet}
</PosterCard>
