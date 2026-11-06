import type { DateRangeParams } from '$lib/requests/models/DateRangeParams.ts';

export function hasDateRange({ startDate, endDate }: DateRangeParams): boolean {
  return startDate !== undefined || endDate !== undefined;
}
