import type { TriggerSnippet } from '$lib/components/menus/TriggerSnippet.ts';
import type { Snippet } from 'svelte';

export type TooltipProps = {
  // The tooltip adds no element, so a press and the tab order stay the button's.
  trigger: TriggerSnippet;
  // A menu's or popover's trigger props or a plain button's click; an `onclick` after the spread would drop the tooltip's.
  triggerProps?: Record<string, unknown>;
  content: string | Snippet;
  variant?: 'default' | 'compact';
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
  sideOffset?: number;
  disabled?: boolean;
  /*
    Let the pointer pass straight through the tooltip content instead of the
    content staying hoverable. Needed when the tooltip renders over another
    hover target (e.g. an adjacent cell in a grid), where hoverable content
    would swallow the pointer and keep showing stale data. Forwarded to
    bits-ui, which sets pointer-events: none on the content.
  */
  disableHoverableContent?: boolean;
  // A blocked control's press does nothing, so its reason stays up.
  keepOpenOnPress?: boolean;
};
