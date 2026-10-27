import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { ShowSiloLastEpisodeMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloLastEpisodeMappedMock.ts';
import { ShowSiloProgressMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloProgressMappedMock.ts';
import { ShowSiloSeasonEpisodesMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonEpisodesMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { recentEpisodes } from './recentEpisodes.ts';

const NOW = new Date('2026-10-19T12:00:00.000Z');

const SEASON_ONE = ShowSiloSeasonEpisodesMappedMock;

const episode = (number: number) =>
  assertDefined(SEASON_ONE.find((entry) => entry.number === number));

// Season one's episodes, moved into season two under ids of their own.
const SEASON_TWO = SEASON_ONE.map((entry) => ({
  ...entry,
  id: -entry.id,
  season: 2,
}));

const seasonTwoEpisode = (number: number) =>
  assertDefined(SEASON_TWO.find((entry) => entry.number === number));

const NEXT_EPISODE = assertDefined(ShowSiloProgressMappedMock.nextEpisode);

const NOTHING_WATCHED = { completed: 0, nextEpisode: NEXT_EPISODE };

const COMPLETE = { ...ShowSiloProgressMappedMock, nextEpisode: null };

const READS = {
  last: ShowSiloLastEpisodeMappedMock,
  lastSeason: SEASON_ONE,
  progress: ShowSiloProgressMappedMock,
  firstSeasonNumber: 1,
  firstSeason: undefined,
  previousSeasonNumber: undefined,
  previousSeason: undefined,
  now: NOW,
};

// The second episode of season two is the last, and season one is the season before it.
const SECOND_SEASON_READS = {
  ...READS,
  last: seasonTwoEpisode(2),
  lastSeason: SEASON_TWO,
  progress: COMPLETE,
  previousSeasonNumber: 1,
  previousSeason: SEASON_ONE,
};

describe('recentEpisodes', () => {
  describe('Up Next', () => {
    it('should take the next episode once an episode is watched', () => {
      expect(recentEpisodes(READS).upNext).toEqual(NEXT_EPISODE);
    });

    it('should hold no card once the show is complete', () => {
      expect(recentEpisodes({ ...READS, progress: COMPLETE }).upNext)
        .toBeNull();
    });

    it("should take the first season's episode 1 while nothing is watched", () => {
      const reads = {
        ...READS,
        progress: NOTHING_WATCHED,
        firstSeason: SEASON_ONE,
      };

      expect(recentEpisodes(reads).upNext).toEqual(episode(1));
    });

    it('should take no card from a list of another season while nothing is watched', () => {
      const reads = {
        ...READS,
        progress: NOTHING_WATCHED,
        firstSeason: SEASON_TWO,
      };

      expect(recentEpisodes(reads).upNext).toBeNull();
    });

    it("should hold no card while nothing is watched and the first season's list is unread", () => {
      const reads = { ...READS, progress: NOTHING_WATCHED };

      expect(recentEpisodes(reads).upNext).toBeNull();
    });

    it('should hold no card without a progress read', () => {
      expect(recentEpisodes({ ...READS, progress: undefined }).upNext)
        .toBeNull();
    });
  });

  describe('Recently Aired', () => {
    it('should take the last episode and the one before it beside an Up Next card', () => {
      expect(recentEpisodes(READS).recentlyAired).toEqual([
        episode(10),
        episode(9),
      ]);
    });

    it('should take the last episode and the two before it without an Up Next card', () => {
      const reads = { ...READS, progress: COMPLETE };

      expect(recentEpisodes(reads).recentlyAired).toEqual([
        episode(10),
        episode(9),
        episode(8),
      ]);
    });

    it('should hold two cards without an Up Next card when the season has two aired episodes and none is before it', () => {
      const reads = {
        ...READS,
        progress: COMPLETE,
        lastSeason: [episode(9), episode(10)],
      };

      expect(recentEpisodes(reads).recentlyAired).toEqual([
        episode(10),
        episode(9),
      ]);
    });

    it('should take the one before it that has aired at the time', () => {
      const ninthAirs = new Date(NOW.getTime() + 1);
      const ninthUnaired = SEASON_ONE.map((entry) =>
        entry.number === 9 ? { ...entry, airDate: ninthAirs } : entry
      );
      const reads = { ...READS, lastSeason: ninthUnaired };

      expect(recentEpisodes(reads).recentlyAired).toEqual([
        episode(10),
        episode(8),
      ]);
    });

    it('should take no episode before it from a list of another season', () => {
      const reads = { ...READS, lastSeason: SEASON_TWO };

      expect(recentEpisodes(reads).recentlyAired).toEqual([episode(10)]);
    });

    it('should hold one card when the season has one aired episode and none is before it', () => {
      const reads = { ...READS, lastSeason: [ShowSiloLastEpisodeMappedMock] };

      expect(recentEpisodes(reads).recentlyAired).toEqual([episode(10)]);
    });

    it("should hold the last episode alone without its season's list", () => {
      const reads = { ...READS, lastSeason: undefined };

      expect(recentEpisodes(reads).recentlyAired).toEqual([episode(10)]);
    });
  });

  describe("when the last episode's season has too few aired episodes", () => {
    it("should fill the row from the previous season's episodes, newest first", () => {
      const reads = { ...SECOND_SEASON_READS, last: seasonTwoEpisode(1) };

      expect(recentEpisodes(reads).recentlyAired).toEqual([
        seasonTwoEpisode(1),
        episode(10),
        episode(9),
      ]);
    });

    it("should take the last episode's season before the previous season", () => {
      expect(recentEpisodes(SECOND_SEASON_READS).recentlyAired).toEqual([
        seasonTwoEpisode(2),
        seasonTwoEpisode(1),
        episode(10),
      ]);
    });

    it('should fill the row up to three cards with an Up Next card', () => {
      const reads = {
        ...SECOND_SEASON_READS,
        last: seasonTwoEpisode(1),
        progress: ShowSiloProgressMappedMock,
      };

      expect(recentEpisodes(reads)).toEqual({
        upNext: NEXT_EPISODE,
        recentlyAired: [seasonTwoEpisode(1), episode(10)],
      });
    });

    it("should leave Up Next out of the previous season's episodes", () => {
      const reads = {
        ...SECOND_SEASON_READS,
        last: seasonTwoEpisode(1),
        progress: { completed: 9, nextEpisode: episode(10) },
      };

      expect(recentEpisodes(reads)).toEqual({
        upNext: episode(10),
        recentlyAired: [seasonTwoEpisode(1), episode(9)],
      });
    });

    it("should take the previous season's episodes that have aired at the time", () => {
      const tenthAirs = new Date(NOW.getTime() + 1);
      const tenthUnaired = SEASON_ONE.map((entry) =>
        entry.number === 10 ? { ...entry, airDate: tenthAirs } : entry
      );
      const reads = {
        ...SECOND_SEASON_READS,
        last: seasonTwoEpisode(1),
        previousSeason: tenthUnaired,
      };

      expect(recentEpisodes(reads).recentlyAired).toEqual([
        seasonTwoEpisode(1),
        episode(9),
        episode(8),
      ]);
    });

    it('should take no episode from a list of another season', () => {
      const reads = {
        ...SECOND_SEASON_READS,
        last: seasonTwoEpisode(1),
        previousSeason: SEASON_TWO,
      };

      expect(recentEpisodes(reads).recentlyAired).toEqual([
        seasonTwoEpisode(1),
      ]);
    });

    it("should hold the last episode's season alone without the previous season's list", () => {
      const reads = { ...SECOND_SEASON_READS, previousSeason: undefined };

      expect(recentEpisodes(reads).recentlyAired).toEqual([
        seasonTwoEpisode(2),
        seasonTwoEpisode(1),
      ]);
    });
  });

  describe('when Up Next is a recently aired episode', () => {
    it('should take the two episodes before the last when Up Next is the last', () => {
      const progress = { completed: 9, nextEpisode: episode(10) };

      expect(recentEpisodes({ ...READS, progress })).toEqual({
        upNext: episode(10),
        recentlyAired: [episode(9), episode(8)],
      });
    });

    it('should take the last episode and the one before Up Next when Up Next is the one before the last', () => {
      const progress = { completed: 8, nextEpisode: episode(9) };

      expect(recentEpisodes({ ...READS, progress })).toEqual({
        upNext: episode(9),
        recentlyAired: [episode(10), episode(8)],
      });
    });
  });

  describe('without a last episode', () => {
    it('should hold no card', () => {
      expect(recentEpisodes({ ...READS, last: null })).toEqual({
        upNext: null,
        recentlyAired: [],
      });
    });
  });
});
