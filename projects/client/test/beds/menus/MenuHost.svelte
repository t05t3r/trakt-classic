<script lang="ts">
  import Menu from '$lib/components/menus/Menu.svelte';
  import MenuItem from '$lib/components/menus/MenuItem.svelte';
  import type { ComponentProps } from 'svelte';

  type MenuHostProps = {
    onSelect: (key: string) => void;
    checked?: ComponentProps<typeof MenuItem>['checked'];
    isInert?: ComponentProps<typeof Menu>['isInert'];
  };

  const { onSelect, checked, isInert }: MenuHostProps = $props();
</script>

<Menu label="Sort by" {isInert}>
  {#snippet trigger({ props })}
    <button type="button" {...props}>Rank</button>
  {/snippet}

  <MenuItem onSelect={() => onSelect('added')}>Added Date</MenuItem>
  <MenuItem onSelect={() => onSelect('title')} closeOnSelect={false}>
    Title
  </MenuItem>
  <MenuItem
    onSelect={() => onSelect('watchlist')}
    closeOnSelect={false}
    {checked}
  >
    Watchlist
  </MenuItem>
</Menu>
