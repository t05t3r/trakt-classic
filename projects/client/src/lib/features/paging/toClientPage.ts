import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import { toPageCount } from '$lib/features/paging/_internal/toPageCount.ts';
import type {
  PagedCard,
  PagedReading,
  PagedRow,
} from '$lib/features/paging/stores/usePagedItems.ts';
import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import { isEmpty } from '$lib/utils/array/isEmpty.ts';

const LOADING = { kind: 'loading' } as const;

export type ToClientPageParams<E, C extends PagedCard> = {
  status: SectionStatus<ReadonlyArray<E>>;
  page: number;
  pageSize: number;
  toRow: (entry: E) => PagedRow<E, C>;
  toCover: (entry: E) => ImageUrl;
};

export function toClientPage<E, C extends PagedCard>(
  { status, page, pageSize, toRow, toCover }: ToClientPageParams<E, C>,
): PagedReading<E, C> {
  if (status.kind === 'loading' || status.kind === 'error') {
    return {
      status,
      pages: { current: page, total: undefined },
      itemCount: undefined,
      cover: undefined,
      entries: undefined,
    };
  }

  const all = status.kind === 'ready' ? status.data : [];
  const total = toPageCount(all.length, pageSize);
  const entries = all.slice((page - 1) * pageSize, page * pageSize);
  const first = entries.at(0);
  const landed = isEmpty(entries)
    ? { kind: 'empty' } as const
    : { kind: 'ready', data: entries.map(toRow) } as const;

  return {
    // Past the last page the clamp's replace is on its way, so its empty answer is no reading.
    status: page > total ? LOADING : landed,
    pages: { current: page, total },
    itemCount: all.length,
    cover: first === undefined ? undefined : toCover(first),
    entries,
  };
}
