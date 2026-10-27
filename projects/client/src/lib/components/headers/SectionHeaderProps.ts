import type { Icon } from '@tabler/icons-svelte';
import type { Snippet } from 'svelte';

export type SectionHeaderProps = {
  title: string | Snippet;
  titleId?: string;
  icon?: Icon;
  loading?: boolean;
  tools?: Snippet;
  helpText?: Snippet;
  spacing?: 'default' | 'wide';
  helpTextGap?: 'default' | 'compact' | 'none';
};
