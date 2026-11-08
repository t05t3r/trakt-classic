import * as m from '$lib/features/i18n/messages.ts';
import {
  type MediaCard,
  toMediaCard,
} from '$lib/features/media-card/toMediaCard.ts';
import { toEpisodeScreenshot } from '$lib/features/media-card/toEpisodeScreenshot.ts';
import type { EpisodeType } from '$lib/requests/models/EpisodeType.ts';
import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import type { ActivityHistory } from '$lib/requests/queries/users/activityHistoryQuery.ts';

export type RecentlyWatchedCard = MediaCard<'movie' | 'episode'> & {
  image: ImageUrl;
  imageAlt: string;
  episodeType?: EpisodeType;
};

export function toRecentlyWatchedCard(
  entry: ActivityHistory,
): RecentlyWatchedCard {
  if (entry.type === 'movie') {
    const { movie } = entry;

    return {
      ...toMediaCard({ type: 'movie', movie }),
      image: movie.cover.url.thumb,
      imageAlt: m.image_alt_media_fanart({ title: movie.title }),
    };
  }

  const { episode, show } = entry;
  const screenshot = toEpisodeScreenshot({ show, episode });

  return {
    ...toMediaCard({ type: 'episode', show, episode }),
    image: screenshot.src,
    imageAlt: screenshot.alt,
    episodeType: episode.type,
  };
}
