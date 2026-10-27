import type { CastGroup } from '$lib/features/summary/_internal/CastGroup.ts';
import { isEmpty } from '$lib/utils/array/isEmpty.ts';

export function hasNoMembers(groups: ReadonlyArray<CastGroup>): boolean {
  return groups.every(({ members }) => isEmpty(members));
}
