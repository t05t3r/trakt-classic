<script lang="ts">
  import ActionSideIcon from '$lib/components/buttons/ActionSideIcon.svelte';
  import Menu from '$lib/components/menus/Menu.svelte';
  import MenuItem from '$lib/components/menus/MenuItem.svelte';
  import IconCirclePlus from '@tabler/icons-svelte/icons/circle-plus';
</script>

<Menu label="Lists">
  {#snippet trigger({ props })}
    <ActionSideIcon icon={IconCirclePlus} label="Add to list" {...props} />
  {/snippet}

  <MenuItem onSelect={() => {}}>Favourites</MenuItem>
</Menu>
