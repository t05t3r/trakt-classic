import { FOCUSABLE_CONTROLS } from './FOCUSABLE_CONTROLS.ts';

export function firstFocusable(container: ParentNode): HTMLElement | undefined {
  return container.querySelector<HTMLElement>(FOCUSABLE_CONTROLS) ?? undefined;
}
