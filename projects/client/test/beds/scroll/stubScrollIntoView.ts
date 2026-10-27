import { onTestFinished, vi } from 'vitest';

// jsdom has no scrollIntoView, so the test defines one and removes it after.
// Registers the removal first, so a call outside a test throws before the define.
export function stubScrollIntoView(onScroll?: () => void) {
  onTestFinished(() => {
    Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  });
  const scroll = vi.fn(onScroll);
  Element.prototype.scrollIntoView = scroll;

  return scroll;
}
