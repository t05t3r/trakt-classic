import { onTestFinished } from 'vitest';

function resizeEntry(target: Element): ResizeObserverEntry {
  const size = [{ blockSize: 0, inlineSize: 0 }];

  return {
    borderBoxSize: size,
    contentBoxSize: size,
    contentRect: new DOMRectReadOnly(),
    devicePixelContentBoxSize: size,
    target,
  };
}

// The global mock fires its callback only once, when the observer is made.
// Registers the restore first, so a call outside a test throws before the swap.
export function controlResize() {
  const original = globalThis.ResizeObserver;
  onTestFinished(() => {
    globalThis.ResizeObserver = original;
  });

  const observers = new Set<ControlledResizeObserver>();

  class ControlledResizeObserver implements ResizeObserver {
    readonly targets = new Set<Element>();
    readonly callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
      observers.add(this);
    }

    // A browser reports a target's first size once it is observed.
    observe(target: Element) {
      this.targets.add(target);
      this.callback([resizeEntry(target)], this);
    }

    unobserve(target: Element) {
      this.targets.delete(target);
    }

    disconnect() {
      this.targets.clear();
    }
  }

  globalThis.ResizeObserver = ControlledResizeObserver;

  return {
    resize(target: Element) {
      [...observers]
        .filter((observer) => observer.targets.has(target))
        .forEach((observer) =>
          observer.callback([resizeEntry(target)], observer)
        );
    },
  };
}
