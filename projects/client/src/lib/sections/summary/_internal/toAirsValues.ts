import { languageTag } from '$lib/features/i18n/languageTag.ts';
import * as m from '$lib/features/i18n/messages.ts';
import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
import { toHumanDayTime } from '$lib/utils/formatting/date/toHumanDayTime.ts';
import { hasEnded } from '$lib/utils/media/hasEnded.ts';
import type { StatsValue } from '$lib/sections/summary/StatsRow.ts';

export function toAirsValues(show: ShowEntry): ReadonlyArray<StatsValue> {
  if (hasEnded(show.status)) return [];
  if (!show.airs || !show.network) return [];

  const slot = toHumanDayTime({ ...show.airs, locale: languageTag() });
  if (!slot) return [];

  return [{
    key: 'airs',
    text: m.text_airs_at_on({ ...slot, network: show.network }),
  }];
}
