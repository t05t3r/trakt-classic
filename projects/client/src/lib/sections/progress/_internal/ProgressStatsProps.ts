import type { ProgressCount } from '$lib/utils/media/isProgressComplete.ts';

export type ProgressStatsProps = ProgressCount & {
  minutesLeft: number;
  // A show's plays and time watched; a season's line leaves them out.
  watched?: { plays: number; minutes: number };
  // Episodes a season lists but has not aired; with no aired episode, the line counts only these.
  announced?: number;
};
