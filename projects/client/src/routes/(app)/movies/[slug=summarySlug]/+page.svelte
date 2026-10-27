<script lang="ts">
  import MoviePage from '$lib/sections/summary/MoviePage.svelte';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();
</script>

<MoviePage slug={params.slug} />
