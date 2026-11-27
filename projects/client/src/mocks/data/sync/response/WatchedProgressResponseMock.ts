import { ShowDevsResponseMock } from '$mocks/data/summary/shows/devs/ShowDevsResponseMock.ts';
import { ShowDevsProgressResponseMock } from '$mocks/data/summary/shows/devs/response/ShowDevsProgressResponseMock.ts';
import type { UpNextResponse } from '@trakt/api';

const {
  aired,
  completed,
  last_watched_at,
  reset_at,
  next_episode,
  last_episode,
} = ShowDevsProgressResponseMock;

// Devs, five of its eight episodes in, and dropped.
export const WatchedProgressResponseMock: UpNextResponse[] = [
  {
    show: ShowDevsResponseMock,
    progress: {
      aired,
      completed,
      last_watched_at,
      reset_at,
      stats: {
        play_count: 5,
        minutes_watched: 260,
        minutes_left: 156,
      },
      next_episode,
      last_episode,
    },
  },
];
