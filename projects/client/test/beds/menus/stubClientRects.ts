import { onTestFinished, vi } from 'vitest';

// jsdom lays nothing out, and bits-ui hides a menu whose trigger has no box.
export function stubClientRects() {
  const spy = vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue(
    Object.assign([new DOMRect()], { item: () => new DOMRect() }),
  );
  onTestFinished(() => spy.mockRestore());
}
