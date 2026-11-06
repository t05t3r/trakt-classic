<script lang="ts" generics="K extends string">
  import DropdownButton from '$lib/components/buttons/DropdownButton.svelte';
  import Menu from './Menu.svelte';
  import MenuItem from './MenuItem.svelte';
  import MenuRadioGroup from './MenuRadioGroup.svelte';
  import type { ChoiceMenuProps } from './_internal/ChoiceMenuProps.ts';

  const ALL = '';

  const {
    label,
    triggerLabel,
    value,
    choices,
    all,
    onChange,
    onRepick,
    font,
    isLimited,
  }: ChoiceMenuProps<K> = $props();

  const shown = $derived(
    value === null
      ? (all ?? '')
      : (choices.find((choice) => choice.value === value)?.label ?? ''),
  );

  // The group reports `null` when the checked row is picked again.
  const select = (next: string | null) => {
    if (next === null) return onRepick?.();
    if (next === ALL) return onChange(null);

    const choice = choices.find((entry) => entry.value === next);
    if (!choice) return;
    onChange(choice.value);
  };
</script>

<Menu {label} {isLimited}>
  {#snippet trigger({ props })}
    <DropdownButton {...props} label={triggerLabel(shown)} {font}>
      {shown}
    </DropdownButton>
  {/snippet}

  <MenuRadioGroup value={value ?? ALL} onValueChange={select}>
    {#if all !== undefined}
      <MenuItem radio={ALL}>{all}</MenuItem>
    {/if}
    {#each choices as choice (choice.value)}
      <MenuItem radio={choice.value}>{choice.label}</MenuItem>
    {/each}
  </MenuRadioGroup>
</Menu>
