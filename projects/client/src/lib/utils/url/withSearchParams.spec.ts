import { describe, expect, it } from 'vitest';
import { withSearchParams } from './withSearchParams.ts';

const BASE = 'http://localhost/users/me/watchlist';

describe('util: withSearchParams', () => {
  it('should set a param and keep the others and the hash', () => {
    const url = new URL(`${BASE}?sort=title,asc#items`);

    const next = withSearchParams({ url, params: { page: '2' } });

    expect(next.href).toBe(`${BASE}?sort=title,asc&page=2#items`);
  });

  it('should replace a param already in the URL', () => {
    const url = new URL(`${BASE}?page=2`);

    const next = withSearchParams({ url, params: { page: '3' } });

    expect(next.href).toBe(`${BASE}?page=3`);
  });

  it('should remove a param written as null', () => {
    const url = new URL(`${BASE}?page=2&display=movie`);

    const next = withSearchParams({ url, params: { page: null } });

    expect(next.href).toBe(`${BASE}?display=movie`);
  });

  it('should write a comma in a value as a literal comma', () => {
    const url = new URL(BASE);

    const next = withSearchParams({ url, params: { sort: 'added,desc' } });

    expect(next.href).toBe(`${BASE}?sort=added,desc`);
  });

  it('should leave the URL it was given unchanged', () => {
    const url = new URL(`${BASE}?page=2`);

    withSearchParams({ url, params: { page: null } });

    expect(url.href).toBe(`${BASE}?page=2`);
  });
});
