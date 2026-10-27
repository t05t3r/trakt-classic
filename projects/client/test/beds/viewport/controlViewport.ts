import { vi } from 'vitest';

type Callback = (
  entries: IntersectionObserverEntry[],
  observer: IntersectionObserver,
) => void;

function entryFor(
  target: Element,
  isIntersecting: boolean,
): IntersectionObserverEntry {
  return {
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
    time: performance.now(),
    boundingClientRect: new DOMRectReadOnly(),
    intersectionRect: new DOMRectReadOnly(),
    rootBounds: null,
    target,
  };
}

// Call it at a spec's top level: `whenInViewport` keeps the first observer it
// makes for the whole file, and the global mock reports every target in view.
export function controlViewport() {
  const observers = new Set<ControlledIntersectionObserver>();

  class ControlledIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin: string;
    readonly scrollMargin = '0px';
    readonly thresholds = [0.1];
    readonly targets = new Set<Element>();
    readonly callback: Callback;

    constructor(callback: Callback, options?: IntersectionObserverInit) {
      this.callback = callback;
      this.rootMargin = options?.rootMargin ?? '0px';
      observers.add(this);
    }

    observe(target: Element) {
      this.targets.add(target);
    }

    unobserve(target: Element) {
      this.targets.delete(target);
    }

    disconnect() {
      this.targets.clear();
    }

    takeRecords() {
      return [];
    }
  }

  vi.stubGlobal('IntersectionObserver', ControlledIntersectionObserver);

  function report(target: Element, isIntersecting: boolean) {
    [...observers]
      .filter((observer) => observer.targets.has(target))
      .forEach((observer) =>
        observer.callback([entryFor(target, isIntersecting)], observer)
      );
  }

  return {
    enter(target: Element) {
      report(target, true);
    },
    leave(target: Element) {
      report(target, false);
    },
    rootMarginsOf(target: Element): ReadonlyArray<string> {
      return [...observers]
        .filter((observer) => observer.targets.has(target))
        .map((observer) => observer.rootMargin);
    },
  };
}
