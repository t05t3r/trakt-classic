import { describe, expect, it } from 'vitest';
import { pickSegment } from './pickSegment.ts';

const TYPES = ['movies', 'shows', 'episodes'] as const;
const RATINGS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const;

describe('util: pickSegment', () => {
  it('should read an empty value as all', () => {
    expect(pickSegment({ value: '', position: 0, values: TYPES })).toBe('all');
  });

  it('should read a known segment at its position', () => {
    expect(pickSegment({ value: 'movies', position: 0, values: TYPES }))
      .toBe('movies');
  });

  it('should read each segment of a longer value at its own position', () => {
    const value = 'all/8/added/asc';

    expect(pickSegment({ value, position: 0, values: TYPES })).toBe('all');
    expect(pickSegment({ value, position: 1, values: RATINGS })).toBe('8');
  });

  it('should read an unknown segment as all', () => {
    expect(pickSegment({ value: 'books/plays', position: 0, values: TYPES }))
      .toBe('all');
  });

  it('should read a position past the last segment as all', () => {
    expect(pickSegment({ value: 'movies', position: 1, values: RATINGS }))
      .toBe('all');
  });
});
