import { onTestFinished, vi } from 'vitest';

type RowLayout = {
  itemWidth: number;
  viewWidth: number;
};

// jsdom lays nothing out and has no element scrollTo: each element here sits one
// item's width after the sibling before it, in a box narrower than its row.
export function stubRowLayout({ itemWidth, viewWidth }: RowLayout) {
  const scrollTo = vi.fn(function (this: Element, { left }: ScrollToOptions) {
    this.scrollLeft = left ?? 0;
  });
  Object.defineProperty(Element.prototype, 'scrollTo', {
    value: scrollTo,
    configurable: true,
    writable: true,
  });
  const offsetLeft = vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get')
    .mockImplementation(function (this: HTMLElement) {
      return [...(this.parentElement?.children ?? [])].indexOf(this) *
        itemWidth;
    });
  const offsetWidth = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
    .mockReturnValue(itemWidth);
  const clientWidth = vi.spyOn(Element.prototype, 'clientWidth', 'get')
    .mockReturnValue(viewWidth);
  onTestFinished(() => {
    offsetLeft.mockRestore();
    offsetWidth.mockRestore();
    clientWidth.mockRestore();
    Reflect.deleteProperty(Element.prototype, 'scrollTo');
  });

  return scrollTo;
}
