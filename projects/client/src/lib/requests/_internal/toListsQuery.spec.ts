import { describe, expect, it } from 'vitest';
import { toListsQuery } from './toListsQuery.ts';

describe('toListsQuery', () => {
  it('should ask for the first three personal lists with their images', () => {
    expect(toListsQuery('personal')).toEqual({
      extended: 'images',
      page: 1,
      limit: 3,
    });
  });

  it('should ask for the first 100 official lists with their images', () => {
    expect(toListsQuery('official')).toEqual({
      extended: 'images',
      page: 1,
      limit: 100,
    });
  });
});
