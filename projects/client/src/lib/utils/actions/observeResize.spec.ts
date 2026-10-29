import { mountElement } from '$test/beds/dom/mountElement.ts';
import { controlResize } from '$test/beds/resize/controlResize.ts';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { observeResize } from './observeResize.ts';

function observe(node: HTMLElement, onResize: (node: HTMLElement) => void) {
  const action = observeResize(node, onResize);
  onTestFinished(() => action.destroy?.());
  return action;
}

// Each call's `this` is the observer that watches the element.
function spyOnObserver(method: 'observe' | 'disconnect') {
  const spy = vi.spyOn(ResizeObserver.prototype, method);
  onTestFinished(() => spy.mockRestore());
  return spy;
}

describe('observeResize', () => {
  it('should report the element once it is observed', () => {
    const node = mountElement('div');
    const onResize = vi.fn();

    observe(node, onResize);

    expect(onResize).toHaveBeenCalledExactlyOnceWith(node);
  });

  it('should share one observer across elements', () => {
    const observed = spyOnObserver('observe');

    observe(mountElement('div'), vi.fn());
    observe(mountElement('div'), vi.fn());

    expect(observed).toHaveBeenCalledTimes(2);
    expect(new Set(observed.mock.contexts).size).toBe(1);
  });

  it('should report a resize only to the resized element', () => {
    const { resize } = controlResize();
    const first = mountElement('div');
    const second = mountElement('div');
    const onFirst = vi.fn();
    const onSecond = vi.fn();
    observe(first, onFirst);
    observe(second, onSecond);
    onFirst.mockClear();
    onSecond.mockClear();

    resize(second);

    expect(onFirst).not.toHaveBeenCalled();
    expect(onSecond).toHaveBeenCalledExactlyOnceWith(second);
  });

  it('should report a resize to the callback the update gave', () => {
    const { resize } = controlResize();
    const node = mountElement('div');
    const before = vi.fn();
    const after = vi.fn();
    const action = observe(node, before);
    before.mockClear();

    action.update?.(after);
    resize(node);

    expect(before).not.toHaveBeenCalled();
    expect(after).toHaveBeenCalledExactlyOnceWith(node);
  });

  it('should stop reporting an element once it is destroyed', () => {
    const { resize } = controlResize();
    const gone = mountElement('div');
    const kept = mountElement('div');
    const onGone = vi.fn();
    observe(kept, vi.fn());
    observe(gone, onGone).destroy?.();
    onGone.mockClear();

    resize(gone);

    expect(onGone).not.toHaveBeenCalled();
  });

  it('should drop the observer once no element is left', () => {
    const observed = spyOnObserver('observe');
    const disconnected = spyOnObserver('disconnect');

    observe(mountElement('div'), vi.fn()).destroy?.();
    observe(mountElement('div'), vi.fn());

    const [first, second] = observed.mock.contexts;
    expect(disconnected).toHaveBeenCalledOnce();
    expect(disconnected.mock.contexts.at(0)).toBe(first);
    expect(second).not.toBe(first);
  });
});
