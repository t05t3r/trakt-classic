import type { ActionReturn } from 'svelte/action';

type OnResize = (node: HTMLElement) => void;

const reports = new Map<Element, () => void>();
let observer: ResizeObserver | undefined;

function sharedObserver(): ResizeObserver {
  observer ??= new ResizeObserver((entries) =>
    entries.forEach((entry) => reports.get(entry.target)?.())
  );
  return observer;
}

function release(node: HTMLElement) {
  observer?.unobserve(node);
  reports.delete(node);
  if (reports.size > 0) return;

  observer?.disconnect();
  observer = undefined;
}

export function observeResize(
  node: HTMLElement,
  onResize: OnResize,
): ActionReturn<OnResize> {
  // Set before observing, since a report may follow as soon as it is observed.
  reports.set(node, () => onResize(node));
  sharedObserver().observe(node);

  return {
    update(next) {
      reports.set(node, () => next(node));
    },
    destroy() {
      release(node);
    },
  };
}
