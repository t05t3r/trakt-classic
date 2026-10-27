import type { StatsValue } from '$lib/sections/summary/StatsRow.ts';

export function toRuntimeValues(minutes: number): ReadonlyArray<StatsValue> {
  return minutes > 0 ? [{ key: 'runtime', minutes }] : [];
}
