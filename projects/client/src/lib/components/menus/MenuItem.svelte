<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import MenuRow from './MenuRow.svelte';
  import type { MenuItemProps } from './_internal/MenuItemProps.ts';

  const {
    onSelect,
    closeOnSelect = true,
    checked,
    radio,
    children: row,
  }: MenuItemProps = $props();
</script>

{#if radio !== undefined}
  <DropdownMenu.RadioItem class="trakt-menu-item" value={radio} {closeOnSelect}>
    {#snippet children({ checked: isChecked })}
      <MenuRow checked={isChecked}>{@render row()}</MenuRow>
    {/snippet}
  </DropdownMenu.RadioItem>
{:else if checked === undefined}
  <DropdownMenu.Item class="trakt-menu-item" {onSelect} {closeOnSelect}>
    <MenuRow>{@render row()}</MenuRow>
  </DropdownMenu.Item>
{:else}
  <!-- The caller owns the state: a select reports it and never flips it here. -->
  <DropdownMenu.CheckboxItem
    class="trakt-menu-item"
    bind:checked={() => checked === true, () => {}}
    {onSelect}
    {closeOnSelect}
  >
    <MenuRow {checked}>{@render row()}</MenuRow>
  </DropdownMenu.CheckboxItem>
{/if}

<style lang="scss">
  :global(.trakt-menu-item) {
    outline: none;
    cursor: pointer;
  }

  :global(.trakt-menu-item[data-highlighted]) {
    background: var(--color-surface-raised);
  }
</style>
