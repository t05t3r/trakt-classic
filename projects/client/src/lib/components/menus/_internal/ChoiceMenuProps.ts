import type DropdownButton from '$lib/components/buttons/DropdownButton.svelte';
import type { ComponentProps } from 'svelte';
import type { MenuProps } from './MenuProps.ts';

export type ChoiceMenuProps<K extends string> = {
  // Names the menu.
  label: string;
  // The trigger's accessible name, built around the shown label.
  triggerLabel: (shown: string) => string;
  // `null` is the All row's value.
  value: K | null;
  // A choice's value is never `''`, which the All row holds.
  choices: ReadonlyArray<{ value: K; label: string }>;
  // Given, the label of a first row that picks `null`.
  all?: string;
  // Reports a change only: picking the checked row reports through `onRepick`, if given.
  onChange: (value: K | null) => void;
  onRepick?: () => void;
  font?: ComponentProps<typeof DropdownButton>['font'];
  isLimited?: MenuProps['isLimited'];
};
