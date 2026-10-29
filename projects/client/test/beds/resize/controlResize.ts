import { RESIZE_OBSERVERS } from '$test/mocks/ResizeObserver.mock.ts';

export function controlResize() {
  return {
    resize(target: Element) {
      [...RESIZE_OBSERVERS]
        .filter((observer) => observer.targets.has(target))
        .forEach((observer) => observer.report(target));
    },
  };
}
