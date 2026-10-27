import type { EpisodeActivityHistory } from '$lib/requests/queries/users/episodeActivityHistoryQuery.ts';
import type { EpisodeActivityHistoryResponse } from '@trakt/api';
import { mapToEpisodeEntry } from './mapToEpisodeEntry.ts';
import { mapToShowEntry } from './mapToShowEntry.ts';

export function mapToEpisodeActivityHistory(
  historyEpisode: EpisodeActivityHistoryResponse,
): EpisodeActivityHistory {
  return {
    id: historyEpisode.id,
    key: `episode-${historyEpisode.id}`,
    watchedAt: new Date(historyEpisode.watched_at),
    episode: mapToEpisodeEntry(historyEpisode.episode),
    show: mapToShowEntry(historyEpisode.show),
    type: 'episode' as const,
  };
}
