/** `value` when it is finite and not negative, otherwise `0`. */
export function nonNegativeFinite(value: number): number {
  if (!Number.isFinite(value)) return 0;

  return Math.max(value, 0);
}
