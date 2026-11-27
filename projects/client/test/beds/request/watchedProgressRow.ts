import type { EpisodeResponse } from '@trakt/api';

type WatchedProgressRowParams<T> = Readonly<{
  show: T;
  lastWatchedAt: string | Nil;
  aired?: number;
  completed?: number;
  minutesLeft?: number;
  nextEpisode?: EpisodeResponse;
}>;

// A row of `sync/progress/watched`, by default with no episode aired, watched or next, so only its show and date say anything.
export function watchedProgressRow<T>(
  {
    show,
    lastWatchedAt,
    aired = 0,
    completed = 0,
    minutesLeft = 0,
    nextEpisode,
  }: WatchedProgressRowParams<T>,
) {
  return {
    show,
    progress: {
      aired,
      completed,
      last_watched_at: lastWatchedAt,
      reset_at: null,
      stats: { play_count: 0, minutes_watched: 0, minutes_left: minutesLeft },
      next_episode: nextEpisode ?? null,
      last_episode: null,
    },
  };
}
