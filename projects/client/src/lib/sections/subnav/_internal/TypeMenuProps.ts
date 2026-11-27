import type ChoiceMenu from '$lib/components/menus/ChoiceMenu.svelte';
import type { ComponentProps } from 'svelte';

// The type menu always has an All row.
export type TypeMenuProps<K extends string> = Pick<
  Extract<ComponentProps<typeof ChoiceMenu<K>>, { all: string }>,
  'value' | 'choices' | 'onChange' | 'onRepick'
>;
