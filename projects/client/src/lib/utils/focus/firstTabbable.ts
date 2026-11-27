import { FOCUSABLE_CONTROLS } from './FOCUSABLE_CONTROLS.ts';
import { isUndisplayed } from './isUndisplayed.ts';

const isInTabOrder = (control: HTMLElement) =>
  control.tabIndex >= 0 && !isUndisplayed(control);

export function firstTabbable(container: ParentNode): HTMLElement | undefined {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE_CONTROLS)]
    .find(isInTabOrder);
}
