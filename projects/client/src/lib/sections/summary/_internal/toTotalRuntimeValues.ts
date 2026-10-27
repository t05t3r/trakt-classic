import * as m from '$lib/features/i18n/messages.ts';
import type { StatsValue } from '$lib/sections/summary/StatsRow.ts';
import { countText } from '$lib/utils/formatting/number/countText.ts';

function toEpisodeCount(count: number): string {
  return m.text_total_runtime_episodes({
    episodes: countText.of({ count, unit: 'episodes' }),
  });
}

type TotalRuntimeInput = {
  minutes: number;
  count: number;
};

export function toTotalRuntimeValues(
  { minutes, count }: TotalRuntimeInput,
): ReadonlyArray<StatsValue> {
  if (!(minutes > 0)) return [];
  if (!(count > 0)) return [{ key: 'total-runtime', minutes }];

  return [{ key: 'total-runtime', minutes, alt: toEpisodeCount(count) }];
}
