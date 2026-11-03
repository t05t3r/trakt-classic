import type { SortBy } from '$lib/models/SortBy.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { FavoritedMoviesMappedMock } from '$mocks/data/users/mapped/FavoritedMoviesMappedMock.ts';
import { FavoritedShowsMappedMock } from '$mocks/data/users/mapped/FavoritedShowsMappedMock.ts';
import { itemOfType } from '$test/beds/dashboard/itemOfType.ts';
import { describe, expect, it } from 'vitest';
import { formatSortValue, type FormattedSortValue } from './formatSortValue.ts';
import type { ListEntry } from './ListEntry.ts';

type SortCase = readonly [SortBy, FormattedSortValue | undefined];

const USER_RATING = 8;

function itReadsEachSort(item: ListEntry, cases: ReadonlyArray<SortCase>) {
  it.each(cases)('should read %s as %o', (sortBy, expected) => {
    expect(formatSortValue({ item, sortBy, userRating: USER_RATING }))
      .toEqual(expected);
  });
}

describe('formatSortValue', () => {
  describe('for a movie', () => {
    const item = itemOfType('movie');

    itReadsEachSort(item, [
      ['added', {
        kind: 'date',
        date: new Date('2025-08-11T02:34:39.000Z'),
        zoned: true,
        pattern: 'd MMM yyyy HH:mm',
      }],
      // A movie's release is a date-only day, the same in every zone.
      ['released', {
        kind: 'date',
        date: new Date('2022-03-04T00:00:00.000Z'),
        zoned: false,
        pattern: 'd MMM yyyy',
      }],
      ['runtime', { kind: 'minutes', minutes: 177 }],
      ['percentage', { kind: 'text', text: '80%' }],
      ['votes', { kind: 'text', text: '49,710' }],
      ['my_rating', { kind: 'text', text: '8' }],
      ['rank', undefined],
      ['title', undefined],
      ['popularity', undefined],
    ]);

    it('should read TBA for a missing release date', () => {
      const unreleased = {
        ...item,
        entry: { ...item.entry, airDate: MAX_DATE },
      };

      expect(formatSortValue({ item: unreleased, sortBy: 'released' }))
        .toEqual({ kind: 'text', text: 'TBA' });
    });

    it('should read nothing for an unknown runtime', () => {
      const unknown = { ...item, entry: { ...item.entry, runtime: NaN } };

      expect(formatSortValue({ item: unknown, sortBy: 'runtime' }))
        .toBeUndefined();
    });

    it('should read nothing without a community rating', () => {
      const unrated = { ...item, entry: { ...item.entry, rating: null } };

      expect(formatSortValue({ item: unrated, sortBy: 'percentage' }))
        .toBeUndefined();
    });

    it('should read nothing for a vote count of 0', () => {
      const unvoted = { ...item, entry: { ...item.entry, votes: 0 } };

      expect(formatSortValue({ item: unvoted, sortBy: 'votes' }))
        .toBeUndefined();
    });

    it('should read nothing without a rating from the viewer', () => {
      expect(formatSortValue({ item, sortBy: 'my_rating', userRating: null }))
        .toBeUndefined();
      expect(formatSortValue({ item, sortBy: 'my_rating' })).toBeUndefined();
    });
  });

  describe('for a show', () => {
    itReadsEachSort(itemOfType('show'), [
      ['added', {
        kind: 'date',
        date: new Date('2025-08-15T00:50:58.000Z'),
        zoned: true,
        pattern: 'd MMM yyyy HH:mm',
      }],
      ['released', {
        kind: 'date',
        date: new Date('2022-04-01T04:00:00.000Z'),
        zoned: true,
        pattern: 'd MMM yyyy',
      }],
      ['runtime', { kind: 'minutes', minutes: 1576 }],
      ['percentage', { kind: 'text', text: '85%' }],
      ['votes', { kind: 'text', text: '10,028' }],
      ['my_rating', { kind: 'text', text: '8' }],
      ['rank', undefined],
      ['title', undefined],
      ['popularity', undefined],
    ]);
  });

  describe('for a season', () => {
    const item = itemOfType('season');

    itReadsEachSort(item, [
      ['added', {
        kind: 'date',
        date: new Date('2026-07-09T14:40:33.000Z'),
        zoned: true,
        pattern: 'd MMM yyyy HH:mm',
      }],
      ['released', {
        kind: 'date',
        date: new Date('2026-07-03T01:00:00.000Z'),
        zoned: true,
        pattern: 'd MMM yyyy',
      }],
      ['runtime', { kind: 'minutes', minutes: 545 }],
      ['percentage', { kind: 'text', text: '82%' }],
      ['votes', { kind: 'text', text: '343' }],
      ['my_rating', { kind: 'text', text: '8' }],
      ['rank', undefined],
      ['title', undefined],
      ['popularity', undefined],
    ]);

    it('should read nothing for a missing vote count', () => {
      const unvoted = {
        ...item,
        entry: { ...item.entry, season: { ...item.entry.season, votes: null } },
      };

      expect(formatSortValue({ item: unvoted, sortBy: 'votes' }))
        .toBeUndefined();
    });
  });

  describe('for an episode', () => {
    itReadsEachSort(itemOfType('episode'), [
      ['added', {
        kind: 'date',
        date: new Date('2026-07-09T14:46:37.000Z'),
        zoned: true,
        pattern: 'd MMM yyyy HH:mm',
      }],
      ['released', {
        kind: 'date',
        date: new Date('2022-08-22T01:00:00.000Z'),
        zoned: true,
        pattern: 'd MMM yyyy',
      }],
      ['runtime', { kind: 'minutes', minutes: 66 }],
      ['percentage', { kind: 'text', text: '80%' }],
      ['votes', { kind: 'text', text: '7,477' }],
      ['my_rating', { kind: 'text', text: '8' }],
      ['rank', undefined],
      ['title', undefined],
      ['popularity', undefined],
    ]);
  });

  describe('for a favourite movie', () => {
    itReadsEachSort(assertDefined(FavoritedMoviesMappedMock.at(0)), [
      ['added', {
        kind: 'date',
        date: new Date('2025-01-16T17:37:18.000Z'),
        zoned: true,
        pattern: 'd MMM yyyy HH:mm',
      }],
      ['released', {
        kind: 'date',
        date: new Date('2024-11-08T00:00:00.000Z'),
        zoned: false,
        pattern: 'd MMM yyyy',
      }],
      ['runtime', { kind: 'minutes', minutes: 111 }],
    ]);
  });

  describe('for a favourite show', () => {
    itReadsEachSort(assertDefined(FavoritedShowsMappedMock.at(0)), [
      ['added', {
        kind: 'date',
        date: new Date('2025-01-16T17:37:41.000Z'),
        zoned: true,
        pattern: 'd MMM yyyy HH:mm',
      }],
      ['released', {
        kind: 'date',
        date: new Date('2023-05-05T01:00:00.000Z'),
        zoned: true,
        pattern: 'd MMM yyyy',
      }],
      ['runtime', { kind: 'minutes', minutes: 900 }],
    ]);
  });
});
