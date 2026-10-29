// The observers watching an element, so a spec can report a later resize.
export const RESIZE_OBSERVERS = new Set<MockResizeObserver>();

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

class MockResizeObserver implements ResizeObserver {
  readonly targets = new Set<Element>();
  readonly #callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.#callback = callback;
  }

  // A browser reports a target's first size once it is observed.
  observe(target: Element) {
    this.targets.add(target);
    RESIZE_OBSERVERS.add(this);
    this.report(target);
  }

  unobserve(target: Element) {
    this.targets.delete(target);
    if (this.targets.size === 0) RESIZE_OBSERVERS.delete(this);
  }

  disconnect() {
    this.targets.clear();
    RESIZE_OBSERVERS.delete(this);
  }

  report(target: Element) {
    this.#callback([resizeEntry(target)], this);
  }
}

globalThis.ResizeObserver = MockResizeObserver;
