import type { Attachment } from 'svelte/attachments';
import type { Hint } from './Hint.ts';

type ReadHint = () => Hint | undefined;

const hints = new WeakMap<Element, ReadHint>();
let shown = $state.raw<HTMLElement | null>(null);

// Gives an element a tooltip, while `read` returns one.
export function hint(read: ReadHint): Attachment<HTMLElement> {
  return (element) => {
    hints.set(element, read);

    return () => {
      hints.delete(element);
      hideHint(element);
    };
  };
}

export function readHint(element: Element): Hint | undefined {
  return hints.get(element)?.();
}

export function closestHinted(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  if (target instanceof HTMLElement && readHint(target)) return target;

  return closestHinted(target.parentElement);
}

export function shownHinted(): HTMLElement | null {
  return shown;
}

export function showHint(element: HTMLElement): void {
  shown = element;
}

export function hideHint(element: HTMLElement): void {
  if (shown === element) shown = null;
}
