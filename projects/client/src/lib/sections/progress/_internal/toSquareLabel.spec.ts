import type { EpisodeSquare } from '$lib/features/progress/stores/useShowProgressDetail.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { ShowSiloSeasonEpisodesMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonEpisodesMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { toSquareLabel } from './toSquareLabel.ts';

const FREEDOM_DAY = assertDefined(ShowSiloSeasonEpisodesMappedMock.at(0));
const OUTSIDE = assertDefined(ShowSiloSeasonEpisodesMappedMock.at(9));

const squareOf = (
  state: EpisodeSquare['state'],
  episode: EpisodeSquare['episode'] = FREEDOM_DAY,
): EpisodeSquare => ({
  number: episode?.number ?? 1,
  state,
  episode,
  watchedAt: null,
});

describe('util: toSquareLabel', () => {
  it('should add Watched to a watched episode', () => {
    expect(toSquareLabel({ season: 1, square: squareOf('watched') }))
      .toBe('1x01 Freedom Day, Watched');
  });

  it('should add Up next to the episode next to watch', () => {
    expect(toSquareLabel({ season: 1, square: squareOf('next') }))
      .toBe('1x01 Freedom Day, Up next');
  });

  it('should add the day an announced episode airs', () => {
    expect(toSquareLabel({ season: 1, square: squareOf('announced', OUTSIDE) }))
      .toBe('1x10 Outside, Airs 30 Jun 2023');
  });

  it('should leave an announced episode with no known air date at its label', () => {
    const square = squareOf('announced', {
      ...OUTSIDE,
      airDate: new Date(Number.NaN),
    });

    expect(toSquareLabel({ season: 1, square })).toBe('1x10 Outside');
  });

  it('should leave an unwatched episode at its label', () => {
    expect(toSquareLabel({ season: 1, square: squareOf('unwatched') }))
      .toBe('1x01 Freedom Day');
  });

  it('should name a square by its sxe and state while its episode loads', () => {
    expect(
      toSquareLabel({
        season: 2,
        square: {
          number: 2,
          state: 'next',
          episode: undefined,
          watchedAt: null,
        },
      }),
    ).toBe('2x02, Up next');
  });
});
