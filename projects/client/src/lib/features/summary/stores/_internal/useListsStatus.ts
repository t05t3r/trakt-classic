import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import type { CreateQueryOptions } from '$lib/features/query/QueryOptions.ts';
import { toFailedStatus } from '$lib/features/query/toFailedStatus.ts';
import { toSectionStatus } from '$lib/features/query/toSectionStatus.ts';
import { useQuery } from '$lib/features/query/useQuery.ts';
import type { ListsType } from '$lib/requests/models/ListsType.ts';
import type { MediaListSummary } from '$lib/requests/models/MediaListSummary.ts';
import { isEmpty } from '$lib/utils/array/isEmpty.ts';
import type { QueryObserverResult } from '@tanstack/query-core';
import { combineLatest, type Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type Lists = ReadonlyArray<MediaListSummary>;

type ListsStatus = SectionStatus<Lists>;

type ListsResult = QueryObserverResult<Lists>;

const listsOf = (status: ListsStatus) =>
  status.kind === 'ready' ? status.data : [];

function toListsStatus(
  results: readonly [official: ListsResult, personal: ListsResult],
): ListsStatus {
  const reads = results.map((result) => toSectionStatus({ result, isEmpty }));

  if (reads.some(({ kind }) => kind === 'loading')) return { kind: 'loading' };

  const failed = toFailedStatus(reads);
  if (failed) return failed;

  const lists = reads.flatMap(listsOf);

  return lists.length === 0
    ? { kind: 'empty' }
    : { kind: 'ready', data: lists };
}

// Query options are invariant in their data, so this takes the lists queries' mutable array.
type ListsQuery = CreateQueryOptions<MediaListSummary[], Error>;

export function useListsStatus(
  toQuery: (type: ListsType) => Observable<ListsQuery>,
): Observable<ListsStatus> {
  return combineLatest([
    useQuery(toQuery('official')),
    useQuery(toQuery('personal')),
  ]).pipe(map(toListsStatus));
}
