import type { ShowProgress } from '$lib/requests/models/ShowProgress.ts';
import { nonNegativeFinite } from '$lib/utils/number/nonNegativeFinite.ts';
import { sum } from '$lib/utils/number/sum.ts';

type ProgressCounts = Pick<ShowProgress, 'completed' | 'total' | 'minutesLeft'>;

export type ProgressStats = Readonly<{
  completed: number;
  aired: number;
  minutesLeft: number;
  shows: number;
}>;

export function sumProgressStats(
  rows: ReadonlyArray<ProgressCounts>,
): ProgressStats {
  return {
    completed: sum(rows.map(({ completed }) => completed)),
    aired: sum(rows.map(({ total }) => total)),
    // A complete show can report negative minutes left; it has none.
    minutesLeft: sum(
      rows.map(({ minutesLeft }) => nonNegativeFinite(minutesLeft)),
    ),
    shows: rows.length,
  };
}
