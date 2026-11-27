import type { UserDropped } from '$lib/features/auth/stores/useUser.ts';
import type { PendingDropLookup } from '$lib/features/media-actions/stores/usePendingDrops.ts';
import { DEVS_WATCHED_PROGRESS } from '$mocks/data/sync/DEVS_WATCHED_PROGRESS.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { DROPPED_AT } from '$mocks/data/users/DROPPED_AT.ts';
import { describe, expect, it } from 'vitest';
import { partitionByDropped } from './partitionByDropped.ts';

const DEVS_ROW = DEVS_WATCHED_PROGRESS;
const SILO_ROW = { ...DEVS_WATCHED_PROGRESS, show: ShowSiloMappedMock };
const ROWS = [DEVS_ROW, SILO_ROW];

const SILO_DROPPED_AT = new Date('2026-06-01T10:00:00.000Z');

const droppedOf = (
  entries: ReadonlyArray<readonly [number, Date]>,
): UserDropped => ({ shows: new Map(entries) });

const DEVS_DROPPED = droppedOf([[DEVS_ROW.show.id, DROPPED_AT]]);

const NOTHING_PENDING: PendingDropLookup = () => undefined;

const pendingFor =
  (showId: number, value: boolean): PendingDropLookup => (id) =>
    id === showId ? value : undefined;

describe('partitionByDropped', () => {
  it('should split the rows by the dropped Snapshot alone when nothing is pending', () => {
    const partition = partitionByDropped({
      rows: ROWS,
      dropped: DEVS_DROPPED,
      isPending: NOTHING_PENDING,
    });

    expect(partition).toEqual({
      watched: [SILO_ROW],
      dropped: [{ ...DEVS_ROW, hiddenAt: DROPPED_AT }],
    });
  });

  it('should list a row whose Drop is pending as dropped, with the date the Snapshot holds', () => {
    const partition = partitionByDropped({
      rows: ROWS,
      dropped: droppedOf([[SILO_ROW.show.id, SILO_DROPPED_AT]]),
      isPending: pendingFor(SILO_ROW.show.id, true),
    });

    expect(partition).toEqual({
      watched: [DEVS_ROW],
      dropped: [{ ...SILO_ROW, hiddenAt: SILO_DROPPED_AT }],
    });
  });

  it('should list a row whose Drop is pending in neither list until the Snapshot holds it', () => {
    const partition = partitionByDropped({
      rows: ROWS,
      dropped: DEVS_DROPPED,
      isPending: pendingFor(SILO_ROW.show.id, true),
    });

    expect(partition).toEqual({
      watched: [],
      dropped: [{ ...DEVS_ROW, hiddenAt: DROPPED_AT }],
    });
  });

  it('should list a row whose Restore is pending as watched, though the Snapshot holds it', () => {
    const partition = partitionByDropped({
      rows: ROWS,
      dropped: DEVS_DROPPED,
      isPending: pendingFor(DEVS_ROW.show.id, false),
    });

    expect(partition).toEqual({ watched: ROWS, dropped: [] });
  });

  it('should give each dropped row the date it was dropped', () => {
    const partition = partitionByDropped({
      rows: ROWS,
      dropped: droppedOf([
        [DEVS_ROW.show.id, DROPPED_AT],
        [SILO_ROW.show.id, SILO_DROPPED_AT],
      ]),
      isPending: NOTHING_PENDING,
    });

    expect(partition.dropped.map(({ hiddenAt }) => hiddenAt)).toEqual([
      DROPPED_AT,
      SILO_DROPPED_AT,
    ]);
  });
});
