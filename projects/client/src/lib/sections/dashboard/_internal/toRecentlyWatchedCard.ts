import * as m from '$lib/features/i18n/messages.ts';
import {
  type MediaCard,
  toMediaCard,
} from '$lib/features/media-card/toMediaCard.ts';
import type { EpisodeType } from '$lib/requests/models/EpisodeType.ts';
import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import type { ActivityHistory } from '$lib/requests/queries/users/activityHistoryQuery.ts';
import { episodeSxeLabel } from '$lib/utils/intl/episodeSxeLabel.ts';

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
      ...toMediaCard({ type: 'movie', movie, playedAt: entry.watchedAt }),
      image: movie.cover.url.thumb,
      imageAlt: m.image_alt_media_fanart({ title: movie.title }),
    };
  }

  const { episode, show } = entry;

  return {
    ...toMediaCard({
      type: 'episode',
      show,
      episode,
      playedAt: entry.watchedAt,
    }),
    image: episode.cover.url.thumb,
    imageAlt: m.image_alt_episode_screenshot({
      show: show.title,
      sxe: episodeSxeLabel(episode),
    }),
    episodeType: episode.type,
  };
}
