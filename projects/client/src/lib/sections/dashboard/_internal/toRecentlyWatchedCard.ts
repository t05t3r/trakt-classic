import type { MediaFanartCardProps } from '$lib/features/media-card/components/MediaFanartCardProps.ts';
import { toEpisodeScreenshot } from '$lib/features/media-card/toEpisodeScreenshot.ts';
import {
  type MediaCard,
  toMediaCard,
} from '$lib/features/media-card/toMediaCard.ts';
import { toMediaFanart } from '$lib/features/media-card/toMediaFanart.ts';
import type { EpisodeType } from '$lib/requests/models/EpisodeType.ts';
import type { ActivityHistory } from '$lib/requests/queries/users/activityHistoryQuery.ts';

export type RecentlyWatchedCard = MediaCard<'movie' | 'episode'> & {
  fanart: MediaFanartCardProps['fanart'];
  episodeType?: EpisodeType;
};

export function toRecentlyWatchedCard(
  entry: ActivityHistory,
): RecentlyWatchedCard {
  if (entry.type === 'movie') {
    const { movie } = entry;

    return {
      ...toMediaCard({ type: 'movie', movie }),
      fanart: toMediaFanart(movie),
    };
  }

  const { episode, show } = entry;

  return {
    ...toMediaCard({ type: 'episode', show, episode }),
    fanart: toEpisodeScreenshot({ show, episode }),
    episodeType: episode.type,
  };
}
