import * as m from '$lib/features/i18n/messages.ts';
import { isKnownDate } from '$lib/utils/date/isKnownDate.ts';
import { toHumanPatternDate } from '$lib/utils/formatting/date/toHumanPatternDate.ts';

export function toAirsText(airDate: Date): string | undefined {
  if (!isKnownDate(airDate)) return undefined;

  return m.tag_text_airs_on({
    date: toHumanPatternDate(airDate, 'd MMM yyyy'),
  });
}
