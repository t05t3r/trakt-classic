import type { Hint } from '../Hint.ts';

export type HintTooltipProps = {
  element: HTMLElement;
  hint: Hint;
  // A close bits-ui asks for: a scroll, Escape, or the pointer leaving both.
  ondismiss: () => void;
};
