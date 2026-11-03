import { expect } from 'vitest';

export function expectDirectionalIcon(icon: Element | Nil) {
  expect(icon).toHaveClass('trakt-icon-directional');
  expect(icon).toHaveAttribute('aria-hidden', 'true');
}
