<script lang="ts">
  import CaptionDateTag from '$lib/components/badges/CaptionDateTag.svelte';
  import EpisodeTypeTag from '$lib/components/badges/EpisodeTypeTag.svelte';
  import { toEpisodeScreenshot } from '$lib/features/media-card/toEpisodeScreenshot.ts';
  import { toMediaCard } from '$lib/features/media-card/toMediaCard.ts';
  import type { EpisodeFanartCardProps } from './EpisodeFanartCardProps.ts';
  import MediaFanartCard from './MediaFanartCard.svelte';

  const {
    show,
    episode,
    withAirDate = false,
    showLine = 'never',
    titles,
  }: EpisodeFanartCardProps = $props();

  const card = $derived(toMediaCard({ type: 'episode', show, episode }));
  const screenshot = $derived(toEpisodeScreenshot({ show, episode }));
</script>

{#snippet caption()}
  <EpisodeTypeTag type={episode.type} />
  {#if withAirDate}
    <CaptionDateTag date={episode.airDate} pattern="d MMM yyyy HH:mm" />
  {/if}
{/snippet}

<MediaFanartCard {card} fanart={screenshot} {caption} {showLine} {titles} />
