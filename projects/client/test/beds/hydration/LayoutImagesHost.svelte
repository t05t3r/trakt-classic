<script lang="ts">
  import LazyImage from '$lib/features/image/components/LazyImage.svelte';
  import { POSTER_PATH } from '$mocks/data/images/POSTER_PATH.ts';
  import type { QueryClient } from '@tanstack/query-core';
  import type { Component, Snippet } from 'svelte';

  type LayoutData = { queryClient: QueryClient };

  type LayoutImagesHostProps = {
    layout: Component<{ data: LayoutData; children: Snippet }>;
    data: LayoutData;
    late: boolean;
  };

  // The layout comes in as a prop, since no alias reaches `src/routes`.
  const { layout: Layout, data, late }: LayoutImagesHostProps = $props();
</script>

<Layout {data}>
  <LazyImage
    src={`/img/${POSTER_PATH}`}
    alt="Heretic"
    kind="poster"
  />
  {#if late}
    <LazyImage
      src="/img/movies/000/075/994/posters/thumb/a12a59d031.jpg.webp"
      alt="Anticipated"
      kind="poster"
    />
  {/if}
</Layout>
