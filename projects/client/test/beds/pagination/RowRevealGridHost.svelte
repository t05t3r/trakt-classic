<script lang="ts">
  import LoadMore from '$lib/components/pagination/LoadMore.svelte';
  import RowRevealGrid from '$lib/components/pagination/RowRevealGrid.svelte';
  import type { RowReveal } from '$lib/components/pagination/RowReveal.ts';

  type RowRevealGridHostProps = {
    count: number;
    rowCount: number;
  };

  let { count, rowCount = $bindable() }: RowRevealGridHostProps = $props();
  let reveal = $state<RowReveal>();

  const items = $derived(
    Array.from({ length: count }, (_, index) => ({ id: index + 1 })),
  );
</script>

<RowRevealGrid
  {items}
  key={(poster) => poster.id}
  columns={{ desktop: 6, tablet: 4, mobile: 2 }}
  rowMax={3}
  navigator="mobile"
  bind:rowCount
  bind:reveal
>
  {#snippet item(poster)}
    <span>Poster {poster.id}</span>
  {/snippet}
</RowRevealGrid>

{#if reveal}
  {@const { openRows, showLess, showMore } = reveal}
  <LoadMore
    variant="dark"
    {showLess}
    {showMore}
    onless={() => (rowCount = openRows - 1)}
    onmore={() => (rowCount = openRows + 1)}
  />
{/if}
