import { AIRED } from '$mocks/data/media-actions/AIRED.ts';
import { time } from '$lib/utils/timing/time.ts';
import { describe, expect, it } from 'vitest';
import { canAddPlay } from './canAddPlay.ts';

const UNAIRED = new Date(Date.now() + time.weeks(1));

describe('util: canAddPlay', () => {
  it.each(
    [
      { type: 'movie', airDate: AIRED, expected: true },
      { type: 'movie', airDate: UNAIRED, expected: false },
      { type: 'movie', airDate: null, expected: false },
      { type: 'episode', airDate: AIRED, expected: true },
      { type: 'episode', airDate: UNAIRED, expected: false },
      { type: 'episode', airDate: null, expected: false },
    ] as const,
  )(
    'should read $expected for a $type aired on $airDate',
    ({ type, airDate, expected }) => {
      expect(canAddPlay({ type, airDate })).toBe(expected);
    },
  );

  it.each(
    [
      { target: { type: 'show', episode: { count: 3 } }, expected: true },
      { target: { type: 'show', episode: { count: 0 } }, expected: false },
      { target: { type: 'season', episodes: { aired: 3 } }, expected: true },
      { target: { type: 'season', episodes: { aired: 0 } }, expected: false },
      { target: { type: 'show', episode: { count: NaN } }, expected: true },
    ] as const,
  )(
    'should read $expected for $target, whatever its air date',
    ({ target, expected }) => {
      expect(canAddPlay({ ...target, airDate: UNAIRED })).toBe(expected);
    },
  );
});
