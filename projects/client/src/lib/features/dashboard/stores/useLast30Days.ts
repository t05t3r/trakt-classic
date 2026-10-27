import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import type { Last30Days } from '$lib/features/dashboard/models/Last30Days.ts';
import { useSnapshotStatus } from '$lib/features/query/useSnapshot.ts';
import { MAX_PAGE_LIMIT } from '$lib/requests/MAX_PAGE_LIMIT.ts';
import { activityHistoryQuery } from '$lib/requests/queries/users/activityHistoryQuery.ts';
import { getStartOfDay } from '$lib/utils/date/getStartOfDay.ts';
import { subtractDays } from '$lib/utils/date/subtractDays.ts';
import type { Observable } from 'rxjs';
import { aggregateLast30Days } from '../_internal/aggregateLast30Days.ts';

const WINDOW_DAYS = 30;

// The clock is read once, so the window, its query key and its links hold still until the page remounts.
export function useLast30Days(): Observable<SectionStatus<Last30Days>> {
  const now = new Date();
  const start = getStartOfDay(subtractDays(now, WINDOW_DAYS - 1));
  const query = activityHistoryQuery({
    slug: 'me',
    startDate: start,
    limit: MAX_PAGE_LIMIT,
  });

  return useSnapshotStatus(query, {
    select: (entries) => ({
      ...aggregateLast30Days({ entries, start, days: WINDOW_DAYS }),
      now,
    }),
    // The empty box replaces the body; a window without plays has no minutes either.
    isEmpty: ({ totals }) => totals.minutes === 0,
  });
}
