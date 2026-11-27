import type { Hint } from '$lib/components/tooltip/Hint.ts';
import * as m from '$lib/features/i18n/messages.ts';
import { episodeSxeLabel } from '$lib/utils/intl/episodeSxeLabel.ts';
import { seasonLabel } from '$lib/utils/intl/seasonLabel.ts';
import type { PosterCardMedia } from '../PosterCardProps.ts';

function toMediaTooltip(media: PosterCardMedia): Hint {
  switch (media.type) {
    case 'movie':
      return {
        content: media.year == null
          ? media.title
          : m.tooltip_text_movie_title_year({
            title: media.title,
            year: media.year,
          }),
      };
    case 'show':
      return { content: media.title };
    case 'season':
      return { content: media.show, detail: seasonLabel(media.number) };
    case 'episode':
      return {
        content: media.show,
        detail: m.tooltip_text_episode_sxe_title({
          sxe: episodeSxeLabel(media),
          title: media.title,
        }),
      };
  }
}

// The line is one more dimmer one, under the media's own.
export function toCardTooltip(
  media: PosterCardMedia,
  line?: string,
): Hint {
  const tooltip = toMediaTooltip(media);
  if (!line) return tooltip;

  const detail = [tooltip.detail, line].filter(Boolean).join('\n');
  return { ...tooltip, detail };
}
