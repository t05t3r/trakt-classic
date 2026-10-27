import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { holdFallbackFocus } from './holdFallbackFocus.ts';

const mountTarget = () => {
  const target = document.createElement('main');
  document.body.append(target);
  onTestFinished(() => target.remove());
  return target;
};

const mountButton = () => {
  const button = document.createElement('button');
  document.body.append(button);
  onTestFinished(() => button.remove());
  return button;
};

describe('util: holdFallbackFocus', () => {
  it('should focus the target without scrolling', () => {
    const target = mountTarget();
    const focus = vi.spyOn(target, 'focus');

    holdFallbackFocus(target);

    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(target);
  });

  it('should drop the tabindex it added once focus moves elsewhere', () => {
    const target = mountTarget();
    const other = mountButton();

    holdFallbackFocus(target);
    const added = target.getAttribute('tabindex');
    other.focus();

    expect(added).toBe('-1');
    expect(target).not.toHaveAttribute('tabindex');
  });

  it('should keep its tabindex through a blur that leaves it active', () => {
    const target = mountTarget();

    holdFallbackFocus(target);
    target.dispatchEvent(new FocusEvent('blur'));

    expect(document.activeElement).toBe(target);
    expect(target).toHaveAttribute('tabindex', '-1');
  });

  it('should still drop its tabindex on a real blur after one that left it active', () => {
    const target = mountTarget();
    const other = mountButton();

    holdFallbackFocus(target);
    target.dispatchEvent(new FocusEvent('blur'));
    other.focus();

    expect(target).not.toHaveAttribute('tabindex');
  });

  it('should leave no listener behind once focus moves elsewhere', () => {
    const target = mountTarget();
    const other = mountButton();

    holdFallbackFocus(target);
    const focused = document.activeElement === target;
    other.focus();
    const dropped = !target.hasAttribute('tabindex');
    // A drop listener still attached would strip this tabindex on the next blur.
    target.tabIndex = 0;
    target.focus();
    other.focus();

    expect(focused).toBe(true);
    expect(dropped).toBe(true);
    expect(target).toHaveAttribute('tabindex', '0');
  });

  it('should leave a tabindex the target already carries', () => {
    const target = mountTarget();
    target.tabIndex = 0;

    holdFallbackFocus(target);
    const focused = document.activeElement === target;
    target.blur();

    expect(focused).toBe(true);
    expect(target).toHaveAttribute('tabindex', '0');
  });
});
