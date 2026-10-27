<script lang="ts">
  import Menu from '$lib/components/menus/Menu.svelte';
  import MenuItem from '$lib/components/menus/MenuItem.svelte';
  import MenuRadioGroup from '$lib/components/menus/MenuRadioGroup.svelte';

  type RadioMenuHostProps = {
    value: string | null;
    onValueChange: (value: string | null) => void;
  };

  const { value, onValueChange }: RadioMenuHostProps = $props();
</script>

<Menu label="Sort by">
  {#snippet trigger({ props })}
    <button type="button" {...props}>Rank</button>
  {/snippet}

  <MenuRadioGroup {value} {onValueChange}>
    <MenuItem radio="added">Added Date</MenuItem>
    <MenuItem radio="title">Title</MenuItem>
  </MenuRadioGroup>
</Menu>
