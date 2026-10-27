<script lang="ts">
  import ShowPage from '$lib/sections/summary/ShowPage.svelte';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();
</script>

<ShowPage slug={params.slug} />
