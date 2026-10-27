import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { describe, expect, it } from 'vitest';
import { bucketByWindowDay, type WindowDay } from './bucketByWindowDay.ts';

type Play = { id: number; at: Date };

function play(id: number, at: string): Play {
  return { id, at: new Date(at) };
}

const dayOf = ({ at }: Play) => at;

function idsOf(days: ReadonlyArray<WindowDay<Play>>) {
  return days.map(({ key, items }) => ({
    key,
    ids: items.map(({ id }) => id),
  }));
}

describe('util: bucketByWindowDay', () => {
  it('should give every day of the window a padded key and its local midnight, empty days included', () => {
    const days = bucketByWindowDay({
      items: [],
      dayOf,
      start: new Date(2026, 8, 8),
      days: 3,
    });

    expect(days).toEqual([
      { key: '2026-09-08', date: new Date(2026, 8, 8), items: [] },
      { key: '2026-09-09', date: new Date(2026, 8, 9), items: [] },
      { key: '2026-09-10', date: new Date(2026, 8, 10), items: [] },
    ]);
  });

  it("should put each item on its date's local day, in the caller's order", () => {
    const days = bucketByWindowDay({
      items: [
        play(1, '2026-07-11T20:00:00.000Z'),
        play(2, '2026-07-10T08:00:00.000Z'),
        play(3, '2026-07-11T02:00:00.000Z'),
      ],
      dayOf,
      start: new Date(2026, 6, 10),
      days: 2,
    });

    expect(idsOf(days)).toEqual([
      { key: '2026-07-10', ids: [2] },
      { key: '2026-07-11', ids: [1, 3] },
    ]);
  });

  it('should drop the items dated before the window and after its last day', () => {
    const days = bucketByWindowDay({
      items: [
        play(1, '2026-07-09T23:59:59.000Z'),
        play(2, '2026-07-10T00:00:00.000Z'),
        play(3, '2026-07-11T23:59:59.000Z'),
        play(4, '2026-07-12T00:00:00.000Z'),
      ],
      dayOf,
      start: new Date(2026, 6, 10),
      days: 2,
    });

    expect(idsOf(days)).toEqual([
      { key: '2026-07-10', ids: [2] },
      { key: '2026-07-11', ids: [3] },
    ]);
  });

  it('should start each day at its local midnight when the start carries a time of day', () => {
    const days = bucketByWindowDay({
      items: [play(1, '2026-07-10T03:00:00.000Z')],
      dayOf,
      start: new Date(2026, 6, 10, 15, 30),
      days: 2,
    });

    expect(days).toEqual([
      {
        key: '2026-07-10',
        date: new Date(2026, 6, 10),
        items: [play(1, '2026-07-10T03:00:00.000Z')],
      },
      { key: '2026-07-11', date: new Date(2026, 6, 11), items: [] },
    ]);
  });

  it('should key and start the days by the local date east of UTC', () => {
    setTimeZone('Asia/Tokyo');

    const days = bucketByWindowDay({
      items: [
        play(1, '2026-07-09T14:00:00.000Z'),
        play(2, '2026-07-09T16:00:00.000Z'),
      ],
      dayOf,
      start: new Date('2026-07-09T20:00:00.000Z'),
      days: 2,
    });

    expect(days.map(({ key, date }) => ({ key, date }))).toEqual([
      { key: '2026-07-10', date: new Date('2026-07-09T15:00:00.000Z') },
      { key: '2026-07-11', date: new Date('2026-07-10T15:00:00.000Z') },
    ]);
    expect(idsOf(days)).toEqual([
      { key: '2026-07-10', ids: [2] },
      { key: '2026-07-11', ids: [] },
    ]);
  });

  it('should start each day at its local midnight across a clock change', () => {
    setTimeZone('America/New_York');

    const days = bucketByWindowDay({
      items: [],
      dayOf,
      start: new Date(2026, 2, 7, 23, 30),
      days: 3,
    });

    expect(days.map(({ key, date }) => ({ key, date }))).toEqual([
      { key: '2026-03-07', date: new Date('2026-03-07T05:00:00.000Z') },
      { key: '2026-03-08', date: new Date('2026-03-08T05:00:00.000Z') },
      { key: '2026-03-09', date: new Date('2026-03-09T04:00:00.000Z') },
    ]);
  });

  it('should give each local day one entry when the zone skips a calendar day', () => {
    setTimeZone('Pacific/Apia');

    const days = bucketByWindowDay({
      items: [play(1, '2011-12-30T12:00:00.000Z')],
      dayOf,
      start: new Date(2011, 11, 28, 15),
      days: 5,
    });

    expect(days.map(({ key, date }) => ({ key, date }))).toEqual([
      { key: '2011-12-28', date: new Date('2011-12-28T10:00:00.000Z') },
      { key: '2011-12-29', date: new Date('2011-12-29T10:00:00.000Z') },
      { key: '2011-12-31', date: new Date('2011-12-30T10:00:00.000Z') },
      { key: '2012-01-01', date: new Date('2011-12-31T10:00:00.000Z') },
    ]);
    expect(idsOf(days)).toEqual([
      { key: '2011-12-28', ids: [] },
      { key: '2011-12-29', ids: [] },
      { key: '2011-12-31', ids: [1] },
      { key: '2012-01-01', ids: [] },
    ]);
  });
});
