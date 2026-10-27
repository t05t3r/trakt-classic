<script lang="ts">
  import PosterCard from '$lib/components/media/PosterCard.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import LazyImage from '$lib/features/image/components/LazyImage.svelte';
  import QuickActions from '$lib/features/media-actions/components/QuickActions.svelte';
  import CardCommunityRating from './CardCommunityRating.svelte';
  import type { MediaPosterCardProps } from './MediaPosterCardProps.ts';

  const {
    card,
    poster,
    posterTitle,
    badges,
    progress,
    ...subtitles
  }: MediaPosterCardProps = $props();
</script>

<PosterCard
  media={card.media}
  href={card.href}
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
    <QuickActions target={card.target} size="smaller">
      {#snippet metadata()}
        <CardCommunityRating rating={card.rating} variant="smaller" />
      {/snippet}
    </QuickActions>
  {/snippet}
</PosterCard>
