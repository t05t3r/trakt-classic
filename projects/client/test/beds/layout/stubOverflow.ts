import { onTestFinished, vi } from 'vitest';

// jsdom lays nothing out, so every element is made to read taller than its clamp.
export function stubOverflow() {
  const scroll = vi.spyOn(Element.prototype, 'scrollHeight', 'get')
    .mockReturnValue(600);
  const client = vi.spyOn(Element.prototype, 'clientHeight', 'get')
    .mockReturnValue(300);
  onTestFinished(() => {
    scroll.mockRestore();
    client.mockRestore();
  });
}
