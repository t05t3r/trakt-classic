import * as m from '$lib/features/i18n/messages.ts';
import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';

export function episodeSxeLabel(
  { season, number }: { season: number; number: number },
): string {
  if (season === SPECIALS) return m.text_episode_special({ episode: number });

  return m.text_episode_sxe({
    season,
    episode: String(number).padStart(2, '0'),
  });
}
