<script lang="ts">
  import FanartCard from '$lib/components/media/FanartCard.svelte';
  import LazyImage from '$lib/features/image/components/LazyImage.svelte';
  import QuickActions from '$lib/features/media-actions/components/QuickActions.svelte';
  import CardCommunityRating from './CardCommunityRating.svelte';
  import type { MediaFanartCardProps } from './MediaFanartCardProps.ts';
  import UserRatingCorner from './UserRatingCorner.svelte';

  const {
    card,
    fanart,
    caption,
    status,
    showLine,
    titles,
    favorite,
    historyId,
    playedAt,
  }: MediaFanartCardProps = $props();
</script>

<!-- The corner and the strip read their Target once, so a new Target remakes the card. -->
{#key `${card.target.type}:${card.target.id}`}
  <FanartCard
    media={card.media}
    href={card.href}
    showHref={card.showHref}
    {caption}
    {showLine}
    {titles}
  >
    {#snippet image()}
      <LazyImage src={fanart.src} alt={fanart.alt} kind="fanart" />
    {/snippet}
    {#snippet badges()}
      <UserRatingCorner target={{ type: card.target.type, id: card.target.id }} />
    {/snippet}
    {#snippet actions()}
      <QuickActions
        target={card.target}
        {favorite}
        {historyId}
        {playedAt}
        {status}
      >
        {#snippet metadata(hasPlay)}
          <CardCommunityRating
            rating={card.rating}
            target={card.target}
            {hasPlay}
          />
        {/snippet}
      </QuickActions>
    {/snippet}
  </FanartCard>
{/key}
