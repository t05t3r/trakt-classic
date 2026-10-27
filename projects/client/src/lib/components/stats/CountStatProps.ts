import type { Icon } from '@tabler/icons-svelte';
import type { Snippet } from 'svelte';

export type CountStatProps = {
  icon: Icon;
  // A formatted number, or a snippet for a value that renders itself.
  value: string | Snippet;
  // Read in place of the glyph, and shown as the tooltip.
  label: string;
};
