import type {
  NeverEmptyStatus,
  SectionStatus,
} from '$lib/components/feedback/SectionStatus.ts';
import { toSectionStatus } from '$lib/features/query/toSectionStatus.ts';
import { useQuery } from '$lib/features/query/useQuery.ts';
import { useSnapshotStatus } from '$lib/features/query/useSnapshot.ts';
import type { UpNextEntry } from '$lib/requests/models/UpNextEntry.ts';
import { upNextQuery } from '$lib/requests/queries/sync/upNextQuery.ts';
import {
  type HiddenSeason,
  hiddenSeasonsQuery,
} from '$lib/requests/queries/users/hiddenSeasonsQuery.ts';
import { isEmpty } from '$lib/utils/array/isEmpty.ts';
import type { QueryObserverResult } from '@tanstack/query-core';
import { combineLatest, map, type Observable } from 'rxjs';

type UpNextReads = readonly [
  QueryObserverResult<ReadonlyArray<UpNextEntry> | Nil>,
  NeverEmptyStatus<ReadonlyArray<HiddenSeason>>,
];

type HiddenNextParams = {
  entry: UpNextEntry;
  hiddenSeasons: ReadonlyArray<HiddenSeason>;
};

// Up Next still lists a show whose every season is hidden, with nothing watched.
function isNextHidden({ entry, hiddenSeasons }: HiddenNextParams): boolean {
  if (entry.completed > 0) return false;

  return hiddenSeasons.some(({ showId, number }) =>
    showId === entry.show.id && number === entry.season
  );
}

// Loading until the hidden seasons are known too, so an entry they drop never shows and then leaves.
function toUpNextStatus(
  [result, hidden]: UpNextReads,
): SectionStatus<ReadonlyArray<UpNextEntry>> {
  if (hidden.kind === 'loading') return { kind: 'loading' };
  // A failed hidden list leaves Up Next unfiltered rather than fail the section.
  const hiddenSeasons = hidden.kind === 'ready' ? hidden.data : [];

  return toSectionStatus({
    result,
    // A 204 leaves the query's data null.
    select: (entries) =>
      (entries ?? []).filter((entry) =>
        !isNextHidden({ entry, hiddenSeasons })
      ),
    isEmpty,
  });
}

export function useUpNext(): Observable<
  SectionStatus<ReadonlyArray<UpNextEntry>>
> {
  return combineLatest([
    useQuery(upNextQuery()),
    useSnapshotStatus(hiddenSeasonsQuery(), { select: (seasons) => seasons }),
  ]).pipe(map(toUpNextStatus));
}
