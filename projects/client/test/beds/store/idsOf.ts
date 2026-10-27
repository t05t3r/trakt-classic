import type { TargetId } from '$lib/requests/models/TargetId.ts';

export function idsOf(entries: ReadonlyArray<TargetId>): ReadonlyArray<number> {
  return entries.map(({ id }) => id);
}
