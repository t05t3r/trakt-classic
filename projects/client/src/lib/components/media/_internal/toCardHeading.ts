import { episodeLabel } from '$lib/utils/intl/episodeLabel.ts';
import { seasonLabel } from '$lib/utils/intl/seasonLabel.ts';
import type { PosterCardMedia } from '../PosterCardProps.ts';

export function toCardHeading(media: PosterCardMedia): string {
  switch (media.type) {
    case 'episode':
      return episodeLabel(media);
    case 'season':
      return seasonLabel(media.number);
    default:
      return media.title;
  }
}
