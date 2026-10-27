<script lang="ts">
  import MenuCheckboxRow from '$lib/components/menus/MenuCheckboxRow.svelte';
  import MenuItem from '$lib/components/menus/MenuItem.svelte';
  import type { ListMenuRowProps } from './ListMenuRowProps.ts';

  const { isOn, add, remove, variant, children }: ListMenuRowProps = $props();
  const checked = $derived(isOn ?? 'unknown');

  const toggle = () => {
    if (isOn === undefined) return;

    void (isOn ? remove() : add());
  };
</script>

{#if variant === 'menu'}
  <MenuItem {checked} onSelect={toggle} closeOnSelect={false}>
    {@render children()}
  </MenuItem>
{:else}
  <MenuCheckboxRow {checked} onToggle={toggle}>
    {@render children()}
  </MenuCheckboxRow>
{/if}
