import * as m from '$lib/features/i18n/messages.ts';
import type {
  SortList,
  SortParam,
} from '$lib/features/view-params/stores/useSortParam.ts';
import type { UpNextSortOption } from '@trakt/api';

// `how` is the URL's direction; an inverted sort requests the other one.
type ProgressSort<K extends string> =
  & SortParam<K>
  & Readonly<{ label: () => string; inverted?: true }>;

export const PROGRESS_SORTS = {
  watched: [
    {
      by: 'added',
      how: 'asc',
      label: m.button_text_sort_watched_date,
      inverted: true,
    },
    { by: 'title', how: 'asc', label: m.button_text_sort_title },
    { by: 'released', how: 'desc', label: m.button_text_sort_release_date },
    { by: 'premiered', how: 'desc', label: m.button_text_sort_premiered },
    { by: 'popularity', how: 'desc', label: m.button_text_sort_popularity },
    { by: 'episodes', how: 'desc', label: m.button_text_sort_episodes },
    { by: 'time', how: 'desc', label: m.button_text_sort_time },
    { by: 'plays', how: 'desc', label: m.button_text_sort_plays },
    { by: 'runtime', how: 'desc', label: m.button_text_sort_runtime },
  ],
  dropped: [
    {
      by: 'added',
      how: 'asc',
      label: m.button_text_sort_watched_date,
      inverted: true,
    },
    { by: 'title', how: 'asc', label: m.button_text_sort_title },
    // Ours: the API names no sort for the date a show was dropped.
    { by: 'hidden', how: 'desc', label: m.button_text_sort_dropped_date },
  ],
} as const satisfies {
  watched: SortList<ProgressSort<UpNextSortOption>>;
  dropped: SortList<
    ProgressSort<Extract<UpNextSortOption, 'added' | 'title'> | 'hidden'>
  >;
};

export type ProgressView = keyof typeof PROGRESS_SORTS;

export type ProgressSortBy<V extends ProgressView> =
  (typeof PROGRESS_SORTS)[V][number]['by'];
