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
    droppedAt,
    rank,
    favorite,
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
    <LazyImage
      src={poster.url.thumb}
      alt={m.image_alt_media_poster({ title: posterTitle })}
      kind="poster"
    />
  {/snippet}
  {#snippet actions()}
    <QuickActions target={card.target} size="smaller" {favorite}>
      {#snippet metadata()}
        <CardCommunityRating rating={card.rating} variant="smaller" />
      {/snippet}
    </QuickActions>
  {/snippet}
</PosterCard>
