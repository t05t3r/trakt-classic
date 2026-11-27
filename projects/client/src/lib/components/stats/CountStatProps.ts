import type { Icon } from '@tabler/icons-svelte';
import type { Snippet } from 'svelte';

type CountStatGlyph =
  | { icon: Icon; glyph?: never }
  // Drawn by the caller, given the class that sizes and colours a glyph.
  | { glyph: Snippet<[string]>; icon?: never };

export type CountStatProps = CountStatGlyph & {
  // A formatted number, or a snippet for a value that renders itself.
  value: string | Snippet;
  // Read in place of the glyph, and shown as the tooltip.
  label: string;
  // `lg` draws the larger glyph a list toolbar's stats take.
  size?: 'lg';
  // The tooltip's dimmer line under the label.
  underCount?: string;
  // Shows the label beside the value on wide screens, not only as the tooltip.
  wideLabel?: boolean;
  // `row` shows the label after the value at every width, as words of a line.
  variant?: 'row';
  // The tooltip in place of the label; a row stat shows a tooltip only with one.
  hint?: string | Snippet;
};
