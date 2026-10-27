import * as m from '$lib/features/i18n/messages.ts';
import { episodeSxeLabel } from '$lib/utils/intl/episodeSxeLabel.ts';
import { seasonLabel } from '$lib/utils/intl/seasonLabel.ts';
import type { PosterCardMedia } from '../PosterCardProps.ts';

export function toCardTooltip(media: PosterCardMedia): string {
  switch (media.type) {
    case 'movie':
      return media.year == null
        ? media.title
        : m.tooltip_text_movie_title_year({
          title: media.title,
          year: media.year,
        });
    case 'show':
      return media.title;
    case 'season':
      return [media.show, seasonLabel(media.number)].join('\n');
    case 'episode':
      return [
        media.show,
        m.tooltip_text_episode_sxe_title({
          sxe: episodeSxeLabel(media),
          title: media.title,
        }),
      ].join('\n');
  }
}
