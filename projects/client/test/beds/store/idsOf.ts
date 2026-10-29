export function idsOf(
  entries: ReadonlyArray<{ id: number }>,
): ReadonlyArray<number> {
  return entries.map(({ id }) => id);
}
