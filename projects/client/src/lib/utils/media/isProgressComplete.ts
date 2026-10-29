export type ProgressCount = { completed: number; total: number };

// A show or season reads watched once it has aired episodes and every one is watched.
export function isProgressComplete(
  { completed, total }: ProgressCount,
): boolean {
  return total > 0 && completed === total;
}
