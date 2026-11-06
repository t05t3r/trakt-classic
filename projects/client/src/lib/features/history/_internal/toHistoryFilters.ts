import { HISTORY_TYPES } from '$lib/features/history/HISTORY_TYPES.ts';
import { pickSegment } from '$lib/utils/url/pickSegment.ts';

export function toHistoryFilters(filters: string) {
  return {
    type: pickSegment({ value: filters, position: 0, values: HISTORY_TYPES }),
  };
}
