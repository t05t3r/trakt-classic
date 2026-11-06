import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { describe, expect, it } from 'vitest';
import { bucketByLocalDay, type LocalDayGroup } from './bucketByLocalDay.ts';

type Play = { id: number; at: Date; runtime: number };

function play(id: number, at: string, runtime = 0): Play {
  return { id, at: new Date(at), runtime };
}

const dayOf = ({ at }: Play) => at;
const minutesOf = ({ runtime }: Play) => runtime;

function idsOf(groups: ReadonlyArray<LocalDayGroup<Play>>) {
  return groups.map(({ key, items }) => ({
    key,
    ids: items.map(({ id }) => id),
  }));
}

describe('util: bucketByLocalDay', () => {
  it('should give no groups for no rows', () => {
    expect(bucketByLocalDay({ rows: [], dayOf })).toEqual([]);
  });

  it('should give each day present its key and local midnight, keeping server order', () => {
    const groups = bucketByLocalDay({
      rows: [
        play(1, '2026-07-11T20:00:00.000Z'),
        play(2, '2026-07-11T08:00:00.000Z'),
        play(3, '2026-07-09T08:00:00.000Z'),
      ],
      dayOf,
    });

    expect(groups.map(({ key, date }) => ({ key, date }))).toEqual([
      { key: '2026-07-11', date: new Date(2026, 6, 11) },
      { key: '2026-07-09', date: new Date(2026, 6, 9) },
    ]);
    expect(idsOf(groups)).toEqual([
      { key: '2026-07-11', ids: [1, 2] },
      { key: '2026-07-09', ids: [3] },
    ]);
  });

  it("should merge a day's rows that are not adjacent into its first-seen group", () => {
    const groups = bucketByLocalDay({
      rows: [
        play(1, '2026-07-11T08:00:00.000Z'),
        play(2, '2026-07-10T08:00:00.000Z'),
        play(3, '2026-07-11T07:00:00.000Z'),
      ],
      dayOf,
    });

    expect(idsOf(groups)).toEqual([
      { key: '2026-07-11', ids: [1, 3] },
      { key: '2026-07-10', ids: [2] },
    ]);
  });

  describe('a day straddling midnight', () => {
    const ROWS = [
      play(1, '2026-07-10T15:30:00.000Z'),
      play(2, '2026-07-10T14:30:00.000Z'),
    ];

    it('should split the rows east of UTC, where midnight falls between them', () => {
      setTimeZone('Asia/Tokyo');

      const groups = bucketByLocalDay({ rows: ROWS, dayOf });

      expect(idsOf(groups)).toEqual([
        { key: '2026-07-11', ids: [1] },
        { key: '2026-07-10', ids: [2] },
      ]);
      expect(groups.at(0)?.date).toEqual(new Date(2026, 6, 11));
    });

    it('should keep the rows together west of UTC, where it does not', () => {
      setTimeZone('America/New_York');

      const groups = bucketByLocalDay({ rows: ROWS, dayOf });

      expect(idsOf(groups)).toEqual([{ key: '2026-07-10', ids: [1, 2] }]);
      expect(groups.at(0)?.date).toEqual(new Date(2026, 6, 10));
    });
  });

  describe('a day whose midnight does not exist', () => {
    it.each([
      {
        zone: 'America/Havana',
        at: '2026-03-08T15:00:00.000Z',
        key: '2026-03-08',
        firstInstant: '2026-03-08T05:00:00.000Z',
      },
      {
        zone: 'Asia/Beirut',
        at: '2026-03-29T09:00:00.000Z',
        key: '2026-03-29',
        firstInstant: '2026-03-28T22:00:00.000Z',
      },
    ])(
      "should date the group at the first instant of the day's own date in $zone",
      ({ zone, at, key, firstInstant }) => {
        setTimeZone(zone);

        const groups = bucketByLocalDay({ rows: [play(1, at)], dayOf });

        expect(groups.map(({ key, date }) => ({ key, date }))).toEqual([
          { key, date: new Date(firstInstant) },
        ]);
      },
    );
  });

  describe('minutes', () => {
    it("should sum each group's minutes", () => {
      const groups = bucketByLocalDay({
        rows: [
          play(1, '2026-07-11T20:00:00.000Z', 45),
          play(2, '2026-07-10T08:00:00.000Z', 100),
          play(3, '2026-07-11T08:00:00.000Z', 103),
        ],
        dayOf,
        minutesOf,
      });

      expect(groups.map(({ minutes }) => minutes)).toEqual([148, 100]);
    });

    it('should keep a sum of zero', () => {
      const groups = bucketByLocalDay({
        rows: [play(1, '2026-07-11T20:00:00.000Z', 0)],
        dayOf,
        minutesOf,
      });

      expect(groups.at(0)?.minutes).toBe(0);
    });

    it('should leave minutes off the groups when it is given no minutesOf', () => {
      const groups = bucketByLocalDay({
        rows: [play(1, '2026-07-11T20:00:00.000Z', 45)],
        dayOf,
      });

      expect(groups.at(0)).not.toHaveProperty('minutes');
    });
  });
});
