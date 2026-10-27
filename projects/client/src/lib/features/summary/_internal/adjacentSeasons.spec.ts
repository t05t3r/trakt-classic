import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
import { ShowSiloSeasonsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsMappedMock.ts';
import { ShowSiloSeasonsWithSpecialsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsWithSpecialsMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { adjacentSeasons } from './adjacentSeasons.ts';

const SEASONS = ShowSiloSeasonsMappedMock;

describe('adjacentSeasons', () => {
  it('should take the seasons either side', () => {
    expect(adjacentSeasons({ seasons: SEASONS, season: 2 }))
      .toEqual({ previous: 1, next: 3 });
  });

  it('should reach past a missing season number', () => {
    const seasons = SEASONS.filter(({ number }) => number !== 2);

    expect(adjacentSeasons({ seasons, season: 1 })).toEqual({ next: 3 });
    expect(adjacentSeasons({ seasons, season: 3 })).toEqual({ previous: 1 });
  });

  it('should reach past a season with no episodes', () => {
    const seasons = SEASONS.map((season) =>
      season.number === 2
        ? { ...season, episodes: { count: 0, aired: 0 } }
        : season
    );

    expect(adjacentSeasons({ seasons, season: 1 })).toEqual({ next: 3 });
    expect(adjacentSeasons({ seasons, season: 3 })).toEqual({ previous: 1 });
  });

  it('should take no season before season 1, the specials included', () => {
    expect(
      adjacentSeasons({
        seasons: ShowSiloSeasonsWithSpecialsMappedMock,
        season: 1,
      }),
    )
      .toEqual({ next: 2 });
  });

  it('should take season 1 after the specials', () => {
    expect(
      adjacentSeasons({
        seasons: ShowSiloSeasonsWithSpecialsMappedMock,
        season: SPECIALS,
      }),
    )
      .toEqual({ next: 1 });
  });
});
