<script lang="ts">
  import type { EpisodeType } from '$lib/requests/models/EpisodeType.ts';
  import ArtRibbon from './ArtRibbon.svelte';
  import { EPISODE_TYPE_TEXT } from './_internal/EPISODE_TYPE_TEXT.ts';

  const { type }: { type: EpisodeType } = $props();

  const text = $derived(EPISODE_TYPE_TEXT[type]);
</script>

{#if text}
  <ArtRibbon {type}>{text()}</ArtRibbon>
{/if}
