import type { TargetMediaType } from '$lib/requests/models/TargetMediaType.ts';

/**
 * Canonical identity of a Target - pending overrides and the reads that
 * consult them must build keys through this helper to agree.
 */
export function toTargetKey(
  type: TargetMediaType,
  id: number,
): string {
  return `${type}:${id}`;
}
