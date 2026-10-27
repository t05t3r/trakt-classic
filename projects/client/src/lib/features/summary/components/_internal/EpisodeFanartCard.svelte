<script lang="ts">
  import CaptionTag from '$lib/components/badges/CaptionTag.svelte';
  import EpisodeTypeTag from '$lib/components/badges/EpisodeTypeTag.svelte';
  import FanartCard from '$lib/components/media/FanartCard.svelte';
  import FormattedDate from '$lib/components/stats/FormattedDate.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import LazyImage from '$lib/features/image/components/LazyImage.svelte';
  import QuickActions from '$lib/features/media-actions/components/QuickActions.svelte';
  import CardCommunityRating from '$lib/features/media-card/components/CardCommunityRating.svelte';
  import UserRatingCorner from '$lib/features/media-card/components/UserRatingCorner.svelte';
  import { toMediaCard } from '$lib/features/media-card/toMediaCard.ts';
  import { isKnownDate } from '$lib/utils/date/isKnownDate.ts';
  import { episodeSxeLabel } from '$lib/utils/intl/episodeSxeLabel.ts';
  import type { EpisodeFanartCardProps } from './EpisodeFanartCardProps.ts';

  const {
    show,
    episode,
    withAirDate = false,
    titles,
  }: EpisodeFanartCardProps = $props();

  const card = $derived(toMediaCard({ type: 'episode', show, episode }));
</script>

<FanartCard media={card.media} href={card.href} omitShowLine {titles}>
  {#snippet image()}
    <LazyImage
      src={episode.cover.url.thumb}
      alt={m.image_alt_episode_screenshot({
        show: show.title,
        sxe: episodeSxeLabel(episode),
      })}
      kind="fanart"
    />
  {/snippet}
  {#snippet caption()}
    <EpisodeTypeTag type={episode.type} />
    {#if withAirDate && isKnownDate(episode.airDate)}
      <CaptionTag>
        <FormattedDate date={episode.airDate} pattern="d MMM yyyy HH:mm" />
      </CaptionTag>
    {/if}
  {/snippet}
  {#snippet badges()}
    {#key card.target.id}
      <UserRatingCorner
        target={{ type: card.target.type, id: card.target.id }}
      />
    {/key}
  {/snippet}
  {#snippet actions()}
    <QuickActions target={card.target}>
      {#snippet metadata()}
        <CardCommunityRating rating={card.rating} />
      {/snippet}
    </QuickActions>
  {/snippet}
</FanartCard>
