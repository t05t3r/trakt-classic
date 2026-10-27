import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
import { ShowSiloSeasonEpisodesMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonEpisodesMappedMock.ts';
import { ShowSiloSeasonsWithSpecialsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsWithSpecialsMappedMock.ts';
import { ShowSiloSeasonsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { type SeasonEpisodes, toNeighbours } from './toNeighbours.ts';

const SLUG = 'silo';

const SEASONS = ShowSiloSeasonsMappedMock;

const EPISODES = ShowSiloSeasonEpisodesMappedMock;

const episodesOfSeason = (season: number) =>
  EPISODES.map((entry) => ({ ...entry, season }));

const seasonOf = (season: number, episodes = episodesOfSeason(season)) => ({
  season,
  episodes,
});

// One Piece numbers its episodes across seasons: season 2 runs from 62 to 77.
const onePieceSeason = (season: number, first: number, last: number) => ({
  season,
  episodes: Array.from({ length: last - first + 1 }, (_, index) => ({
    ...assertDefined(EPISODES.at(0)),
    season,
    number: first + index,
  })),
});

const ONE_PIECE = [
  onePieceSeason(1, 1, 61),
  onePieceSeason(2, 62, 77),
  onePieceSeason(3, 78, 91),
];

type EpisodeCase = {
  season: number;
  number: number;
  episodes?: typeof EPISODES;
  previousSeason?: SeasonEpisodes;
  nextSeason?: SeasonEpisodes;
};

const episodeNeighbours = (
  {
    season,
    number,
    episodes = episodesOfSeason(season),
    previousSeason,
    nextSeason,
  }: EpisodeCase,
) =>
  toNeighbours({
    slug: SLUG,
    season,
    episode: { number, episodes, previousSeason, nextSeason },
  });

const onePieceNeighbours = (season: number, number: number) => {
  const list = (at: number) => ONE_PIECE.find((entry) => entry.season === at);

  return toNeighbours({
    slug: 'one-piece',
    season,
    episode: {
      number,
      episodes: list(season)?.episodes ?? [],
      previousSeason: list(season - 1),
      nextSeason: list(season + 1),
    },
  });
};

describe('toNeighbours', () => {
  describe('for a season', () => {
    it('should link the seasons either side', () => {
      expect(toNeighbours({ slug: SLUG, seasons: SEASONS, season: 2 }))
        .toEqual({
          previous: '/shows/silo/seasons/1',
          next: '/shows/silo/seasons/3',
        });
    });

    it('should link no season before the first or after the last', () => {
      expect(toNeighbours({ slug: SLUG, seasons: SEASONS, season: 1 }))
        .toEqual({ next: '/shows/silo/seasons/2' });
      expect(toNeighbours({ slug: SLUG, seasons: SEASONS, season: 3 }))
        .toEqual({ previous: '/shows/silo/seasons/2' });
    });

    it('should link season 1 and the specials both ways', () => {
      expect(
        toNeighbours({
          slug: SLUG,
          seasons: ShowSiloSeasonsWithSpecialsMappedMock,
          season: 1,
        }),
      )
        .toEqual({
          previous: '/shows/silo/seasons/0',
          next: '/shows/silo/seasons/2',
        });
      expect(
        toNeighbours({
          slug: SLUG,
          seasons: ShowSiloSeasonsWithSpecialsMappedMock,
          season: SPECIALS,
        }),
      )
        .toEqual({ next: '/shows/silo/seasons/1' });
    });

    it('should reach past a missing season number', () => {
      const seasons = SEASONS.filter(({ number }) => number !== 2);

      expect(toNeighbours({ slug: SLUG, seasons, season: 3 }))
        .toEqual({ previous: '/shows/silo/seasons/1' });
    });
  });

  describe('for an episode', () => {
    it('should link the episodes either side within its season', () => {
      expect(
        episodeNeighbours({
          season: 2,
          number: 5,
          previousSeason: seasonOf(1),
          nextSeason: seasonOf(3),
        }),
      ).toEqual({
        previous: '/shows/silo/seasons/2/episodes/4',
        next: '/shows/silo/seasons/2/episodes/6',
      });
    });

    it('should reach past a missing episode number', () => {
      const episodes = EPISODES.filter(({ number }) => number !== 8);

      expect(episodeNeighbours({ season: 1, number: 9, episodes })).toEqual({
        previous: '/shows/silo/seasons/1/episodes/7',
        next: '/shows/silo/seasons/1/episodes/10',
      });
      expect(episodeNeighbours({ season: 1, number: 7, episodes }).next)
        .toBe('/shows/silo/seasons/1/episodes/9');
    });

    it("should link a season's first episode back to the last of the season before", () => {
      expect(
        episodeNeighbours({ season: 2, number: 1, previousSeason: seasonOf(1) })
          .previous,
      ).toBe('/shows/silo/seasons/1/episodes/10');
    });

    it("should link a season's last episode on to the first of the season after", () => {
      expect(
        episodeNeighbours({ season: 1, number: 10, nextSeason: seasonOf(2) })
          .next,
      ).toBe('/shows/silo/seasons/2/episodes/1');
    });

    it('should cross a season end by the numbers of a show that numbers across seasons', () => {
      expect(onePieceNeighbours(1, 61)).toEqual({
        previous: '/shows/one-piece/seasons/1/episodes/60',
        next: '/shows/one-piece/seasons/2/episodes/62',
      });
      expect(onePieceNeighbours(2, 62)).toEqual({
        previous: '/shows/one-piece/seasons/1/episodes/61',
        next: '/shows/one-piece/seasons/2/episodes/63',
      });
      expect(onePieceNeighbours(3, 78).previous)
        .toBe('/shows/one-piece/seasons/2/episodes/77');
    });

    it('should link nothing before the first episode with no season before', () => {
      expect(episodeNeighbours({ season: 1, number: 1 }))
        .toEqual({ next: '/shows/silo/seasons/1/episodes/2' });
    });

    it('should link the last special on to the first episode of the season after', () => {
      const episodes = episodesOfSeason(SPECIALS).slice(0, 4);

      expect(
        episodeNeighbours({
          season: SPECIALS,
          number: 4,
          episodes,
          nextSeason: seasonOf(1),
        }),
      ).toEqual({
        previous: '/shows/silo/seasons/0/episodes/3',
        next: '/shows/silo/seasons/1/episodes/1',
      });
    });

    it('should link nothing after the last episode with no season after', () => {
      const episodes = episodesOfSeason(3).slice(0, 1);

      expect(
        episodeNeighbours({
          season: 3,
          number: 1,
          episodes,
          previousSeason: seasonOf(2),
        }),
      ).toEqual({ previous: '/shows/silo/seasons/2/episodes/10' });
    });

    it('should link nothing across a season end into a season that lists no episodes', () => {
      expect(
        episodeNeighbours({
          season: 2,
          number: 1,
          previousSeason: seasonOf(1, []),
        }),
      ).toEqual({ next: '/shows/silo/seasons/2/episodes/2' });
      expect(
        episodeNeighbours({
          season: 1,
          number: 10,
          nextSeason: seasonOf(2, []),
        }),
      ).toEqual({ previous: '/shows/silo/seasons/1/episodes/9' });
    });
  });
});
