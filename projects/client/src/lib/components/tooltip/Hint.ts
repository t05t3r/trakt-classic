import type { Snippet } from 'svelte';

export type Hint = Readonly<{
  // A snippet renders under the hint host, so it reads only the app's own contexts.
  content: string | Snippet;
  // A dimmer line, or lines joined by a line break, under the content.
  detail?: string;
  side?: 'top' | 'bottom';
  // For a tooltip over another hover target or a link, whose pointer it must not take.
  isPassThrough?: boolean;
  // A blocked control's press does nothing, so its reason stays up.
  keepOpenOnPress?: boolean;
}>;
