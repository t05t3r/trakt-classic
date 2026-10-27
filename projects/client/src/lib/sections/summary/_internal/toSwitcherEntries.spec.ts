import { ShowSiloSeasonEpisodesMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonEpisodesMappedMock.ts';
import { ShowSiloSpecialsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSpecialsMappedMock.ts';
import { ShowSiloSeasonsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { toSwitcherEntries } from './toSwitcherEntries.ts';

describe('toSwitcherEntries', () => {
  describe('on the season page', () => {
    const entries = toSwitcherEntries({
      type: 'season',
      slug: 'silo',
      seasons: [
        ...ShowSiloSeasonsMappedMock.toReversed(),
        ShowSiloSpecialsMappedMock,
      ],
      current: 2,
    });

    it('should list the seasons in the order given, each under its bare number, the specials as Specials', () => {
      expect(entries.map(({ label }) => label)).toEqual([
        '3',
        '2',
        '1',
        'Specials',
      ]);
    });

    it('should link each season to its page', () => {
      expect(entries.map(({ href }) => href)).toEqual([
        '/shows/silo/seasons/3',
        '/shows/silo/seasons/2',
        '/shows/silo/seasons/1',
        '/shows/silo/seasons/0',
      ]);
    });

    it('should mark the current season alone', () => {
      expect(entries.map(({ isCurrent }) => isCurrent)).toEqual([
        false,
        true,
        false,
        false,
      ]);
    });
  });

  describe('on the episode page', () => {
    const entries = toSwitcherEntries({
      type: 'episode',
      slug: 'silo',
      season: 1,
      episodes: ShowSiloSeasonEpisodesMappedMock.slice(0, 3),
      current: 1,
    });

    it("should list the season's episodes, each under its bare number, linked to its page", () => {
      expect(entries.map(({ label, href }) => [label, href])).toEqual([
        ['1', '/shows/silo/seasons/1/episodes/1'],
        ['2', '/shows/silo/seasons/1/episodes/2'],
        ['3', '/shows/silo/seasons/1/episodes/3'],
      ]);
    });

    it('should mark the current episode alone', () => {
      expect(entries.map(({ isCurrent }) => isCurrent)).toEqual([
        true,
        false,
        false,
      ]);
    });
  });
});
