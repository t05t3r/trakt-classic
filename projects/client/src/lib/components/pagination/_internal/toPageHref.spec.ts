import { describe, expect, it } from 'vitest';
import { toPageHref } from './toPageHref.ts';

const BASE = 'http://localhost/users/me/watchlist';

describe('util: toPageHref', () => {
  it('should set the page and keep the other params, a comma left literal', () => {
    const url = new URL(`${BASE}?sort=added,desc&display=movie`);

    expect(toPageHref({ url, page: 3 })).toBe(
      '/users/me/watchlist?sort=added,desc&display=movie&page=3',
    );
  });

  it('should replace the page already in the URL', () => {
    const url = new URL(`${BASE}?page=2&genres=drama`);

    expect(toPageHref({ url, page: 5 })).toBe(
      '/users/me/watchlist?page=5&genres=drama',
    );
  });

  it('should drop the page param for page 1', () => {
    const url = new URL(`${BASE}?sort=added,desc&page=4`);

    expect(toPageHref({ url, page: 1 })).toBe(
      '/users/me/watchlist?sort=added,desc',
    );
  });

  it('should link page 1 to the bare path when no other param is set', () => {
    const url = new URL(`${BASE}?page=2`);

    expect(toPageHref({ url, page: 1 })).toBe('/users/me/watchlist');
  });

  it('should leave out the hash', () => {
    const url = new URL(`${BASE}?page=2#items`);

    expect(toPageHref({ url, page: 3 })).toBe('/users/me/watchlist?page=3');
  });
});
