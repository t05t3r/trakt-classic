import { onTestFinished, vi } from 'vitest';

// Chromium matches `:focus-visible` on focus a key moved, script included, and
// not on focus a pointer moved; jsdom guesses the other way for script focus.
export function emulateFocusVisible(): void {
  let isKeyboard = false;
  const fromKeyboard = () => (isKeyboard = true);
  const fromPointer = () => (isKeyboard = false);
  document.addEventListener('keydown', fromKeyboard, true);
  document.addEventListener('pointerdown', fromPointer, true);

  const matches = Element.prototype.matches;
  const spy = vi.spyOn(Element.prototype, 'matches').mockImplementation(
    function (this: Element, selectors: string) {
      if (selectors !== ':focus-visible') return matches.call(this, selectors);

      return isKeyboard && this === document.activeElement;
    },
  );

  onTestFinished(() => {
    spy.mockRestore();
    document.removeEventListener('keydown', fromKeyboard, true);
    document.removeEventListener('pointerdown', fromPointer, true);
  });
}
