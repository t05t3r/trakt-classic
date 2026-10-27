<script lang="ts">
  import Menu from '$lib/components/menus/Menu.svelte';
  import MenuItem from '$lib/components/menus/MenuItem.svelte';
  import RowRevealGrid from '$lib/components/pagination/RowRevealGrid.svelte';

  type Poster = { id: number };

  type RowRevealMenuGridHostProps = {
    ids: ReadonlyArray<number>;
    rowCount: number;
  };

  const { ids, rowCount }: RowRevealMenuGridHostProps = $props();

  const items = $derived(ids.map((id) => ({ id })));
</script>

<RowRevealGrid
  {items}
  key={(poster: Poster) => poster.id}
  columns={{ desktop: 6, tablet: 4, mobile: 2 }}
  rowMax={3}
  {rowCount}
  fallbackFocus={(grid) => grid.parentElement}
>
  {#snippet item(poster: Poster)}
    <Menu label="Menu {poster.id}">
      {#snippet trigger({ props })}
        <button type="button" {...props}>Menu {poster.id}</button>
      {/snippet}

      <MenuItem onSelect={() => {}}>Right now {poster.id}</MenuItem>
    </Menu>
  {/snippet}
</RowRevealGrid>
