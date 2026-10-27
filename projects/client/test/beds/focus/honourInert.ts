import { onTestFinished, vi } from 'vitest';

// Chromium reflects `inert` to its attribute and never focuses an element in an
// inert subtree; jsdom has no `inert` at all.
export function honourInert(): void {
  Object.defineProperty(HTMLElement.prototype, 'inert', {
    configurable: true,
    get(this: HTMLElement) {
      return this.hasAttribute('inert');
    },
    set(this: HTMLElement, value: boolean) {
      this.toggleAttribute('inert', value);
    },
  });

  const focus = HTMLElement.prototype.focus;
  const spy = vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(
    function (this: HTMLElement, options?: FocusOptions) {
      if (this.closest('[inert]')) return;
      focus.call(this, options);
    },
  );

  onTestFinished(() => {
    spy.mockRestore();
    Reflect.deleteProperty(HTMLElement.prototype, 'inert');
  });
}
