import type DropdownButton from '$lib/components/buttons/DropdownButton.svelte';
import type { ComponentProps } from 'svelte';
import type { MenuProps } from './MenuProps.ts';

type ChoiceMenuFrame<K extends string> = {
  // Names the menu.
  label: string;
  // The trigger's accessible name, built around the shown label.
  triggerLabel: (shown: string) => string;
  // A choice's value is never `''`, which the All row holds.
  choices: ReadonlyArray<{ value: K; label: string }>;
  // Picking the checked row reports through `onRepick`, if given, not `onChange`.
  onRepick?: () => void;
  font?: ComponentProps<typeof DropdownButton>['font'];
  isLimited?: MenuProps['isLimited'];
};

// Only an All row, labelled by `all`, picks `null`, so without one a change is always a choice.
type ChoiceMenuRows<K extends string> =
  | {
    all?: undefined;
    value: K;
    onChange: (value: K) => void;
    // Off its page's default, so its trigger takes the accent.
    changed?: boolean;
  }
  // The All row is the default, so any choice takes the accent.
  | {
    all: string;
    value: K | null;
    onChange: (value: K | null) => void;
    changed?: never;
  };

export type ChoiceMenuProps<K extends string> =
  & ChoiceMenuFrame<K>
  & ChoiceMenuRows<K>;
