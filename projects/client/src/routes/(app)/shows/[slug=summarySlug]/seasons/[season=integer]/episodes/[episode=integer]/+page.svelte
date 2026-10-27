<script lang="ts">
  import EpisodePage from '$lib/sections/summary/EpisodePage.svelte';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();
</script>

<EpisodePage
  slug={params.slug}
  season={Number(params.season)}
  episode={Number(params.episode)}
/>
