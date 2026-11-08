import { mountElement } from '$test/beds/dom/mountElement.ts';
import { controlResize } from '$test/beds/resize/controlResize.ts';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { tabStopOnOverflow } from './tabStopOnOverflow.ts';

function mountScroller(contentHeight: number) {
  const node = mountElement('div');
  vi.spyOn(node, 'clientHeight', 'get').mockReturnValue(100);
  const scrollHeight = vi.spyOn(node, 'scrollHeight', 'get');
  scrollHeight.mockReturnValue(contentHeight);
  return { node, scrollHeight };
}

function track(node: HTMLElement) {
  const { destroy } = tabStopOnOverflow(node);
  onTestFinished(() => destroy?.());
}

describe('tabStopOnOverflow', () => {
  it('should make an overflowing element a tab stop', () => {
    const { node } = mountScroller(101);

    track(node);

    expect(node).toHaveAttribute('tabindex', '0');
  });

  it('should leave an element that fits out of the tab order', () => {
    const { node } = mountScroller(100);

    track(node);

    expect(node).not.toHaveAttribute('tabindex');
  });

  it('should follow a resize both ways', () => {
    const { resize } = controlResize();
    const { node, scrollHeight } = mountScroller(100);
    track(node);

    scrollHeight.mockReturnValue(101);
    resize(node);
    expect(node).toHaveAttribute('tabindex', '0');

    scrollHeight.mockReturnValue(100);
    resize(node);
    expect(node).not.toHaveAttribute('tabindex');
  });
});
