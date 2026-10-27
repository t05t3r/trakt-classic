import * as m from '$lib/features/i18n/messages.ts';
import { isKnownDate } from '$lib/utils/date/isKnownDate.ts';
import { toHumanPatternDate } from '$lib/utils/formatting/date/toHumanPatternDate.ts';
import type { StatsValue } from '$lib/sections/summary/StatsRow.ts';

type DateOnNetworkInput = {
  key: string;
  date: Date;
  pattern: 'd MMMM yyyy' | 'd MMMM yyyy HH:mm';
  network?: string | Nil;
};

export function toDateOnNetworkValues(
  { key, date, pattern, network }: DateOnNetworkInput,
): ReadonlyArray<StatsValue> {
  if (!isKnownDate(date)) return [];

  const text = toHumanPatternDate(date, pattern);
  if (!text) return [];
  if (!network) return [{ key, text }];

  return [{ key, text: m.text_date_on_network({ date: text, network }) }];
}
