import { DEFAULT_PROGRESS_VIEW } from '$lib/features/progress/DEFAULT_PROGRESS_VIEW.ts';
import { PROGRESS_SORTS } from '$lib/features/progress/PROGRESS_SORTS.ts';
import type { ProgressFilters } from '$lib/features/progress/ProgressFilters.ts';
import type {
  SortList,
  SortParam,
} from '$lib/features/view-params/stores/useSortParam.ts';
import { DIRECTIONS } from '$lib/utils/sort/DIRECTIONS.ts';
import { pickSegment } from '$lib/utils/url/pickSegment.ts';

// A miss on either segment takes the view's default, so a sort never meets another's direction.
function pickSort<K extends string>(
  filters: string,
  sorts: SortList<SortParam<K>>,
): SortParam<K> {
  const [fallback] = sorts;
  const by = pickSegment({
    value: filters,
    position: 1,
    values: sorts.map((sort) => sort.by),
  });
  const how = pickSegment({ value: filters, position: 2, values: DIRECTIONS });
  if (by === 'all' || how === 'all') {
    return { by: fallback.by, how: fallback.how };
  }

  return { by, how };
}

export function toProgressFilters(filters: string): ProgressFilters {
  const view = pickSegment({
    value: filters,
    position: 0,
    values: ['dropped'],
  });

  return view === 'dropped'
    ? { view, sort: pickSort(filters, PROGRESS_SORTS.dropped) }
    : {
      view: DEFAULT_PROGRESS_VIEW,
      sort: pickSort(filters, PROGRESS_SORTS[DEFAULT_PROGRESS_VIEW]),
    };
}
