<script lang="ts">
  import SeasonPage from '$lib/sections/summary/SeasonPage.svelte';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();
</script>

<SeasonPage slug={params.slug} season={Number(params.season)} />
