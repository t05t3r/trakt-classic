import { ShowSiloSeasonFourMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonFourMappedMock.ts';
import { ShowSiloSeasonsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsMappedMock.ts';
import { ShowSiloSeasonsWithSpecialsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsWithSpecialsMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { seasonsWithEpisodes } from './seasonsWithEpisodes.ts';

describe('seasonsWithEpisodes', () => {
  it('should keep the seasons with episodes, the specials included', () => {
    expect(seasonsWithEpisodes(ShowSiloSeasonsWithSpecialsMappedMock)).toEqual(
      ShowSiloSeasonsWithSpecialsMappedMock,
    );
  });

  it('should leave out a season with no episodes yet', () => {
    const seasons = [
      ...ShowSiloSeasonsMappedMock,
      ShowSiloSeasonFourMappedMock,
    ];

    expect(seasonsWithEpisodes(seasons)).toEqual(ShowSiloSeasonsMappedMock);
  });
});
