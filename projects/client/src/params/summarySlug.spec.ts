import { describe, expect, it } from 'vitest';
import { match } from './summarySlug.ts';

describe('param: summarySlug', () => {
  it.each([
    'trending',
    'popular',
    'anticipated',
    'recommendations',
    'boxoffice',
    'watched',
    'favorited',
  ])('should reject the list kind %s', (kind) => {
    expect(match(kind)).toBe(false);
  });

  it.each(['from', 'top-gun-maverick-2022', 'from-2022'])(
    'should accept the title slug %s',
    (slug) => {
      expect(match(slug)).toBe(true);
    },
  );
});
