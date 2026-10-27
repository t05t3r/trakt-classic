import { describe, expect, it } from 'vitest';
import { toLanguageName } from './toLanguageName.ts';

describe('toLanguageName', () => {
  it('should display romeno', () => {
    const displayName = toLanguageName('ro', 'pt');

    expect(displayName).toBe('romeno');
  });

  it('should display Dutch', () => {
    const displayName = toLanguageName('nl', 'fr');

    expect(displayName).toBe('néerlandais');
  });

  it('should display English', () => {
    const displayName = toLanguageName('en', 'en');

    expect(displayName).toBe('English');
  });
});
