import type ChoiceMenu from '$lib/components/menus/ChoiceMenu.svelte';
import type { ComponentProps } from 'svelte';

export type TypeMenuProps<K extends string> = Pick<
  ComponentProps<typeof ChoiceMenu<K>>,
  'value' | 'choices' | 'onChange' | 'onRepick'
>;
