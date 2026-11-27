import * as m from '$lib/features/i18n/messages.ts';
import type { EpisodeSquare } from '$lib/features/progress/stores/useShowProgressDetail.ts';
import { episodeLabel } from '$lib/utils/intl/episodeLabel.ts';
import { toAirsText } from './toAirsText.ts';

function toStateText({ state, episode }: EpisodeSquare): string | undefined {
  switch (state) {
    case 'watched':
      return m.tag_text_watched();
    case 'next':
      return m.tag_text_up_next();
    case 'announced':
      return episode && toAirsText(episode.airDate);
    case 'unwatched':
      return undefined;
  }
}

// The square's colour says its state, so its name says it too.
export function toSquareLabel(
  { season, square }: { season: number; square: EpisodeSquare },
): string {
  const label = episodeLabel({
    season,
    number: square.number,
    title: square.episode?.title,
  });
  const state = toStateText(square);

  return state ? `${label}, ${state}` : label;
}
