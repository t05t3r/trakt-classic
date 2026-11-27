import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import type { ShowProgressResponse } from '@trakt/api';
import { ShowDevsSeasonEpisodesResponseMock } from '$mocks/data/summary/shows/devs/response/ShowDevsSeasonEpisodesResponseMock.ts';

const WATCHED = 5;
const RUNTIME = 52;
const STATS = {
  'play_count': WATCHED,
  'minutes_watched': WATCHED * RUNTIME,
  'minutes_left': 3 * RUNTIME,
};

const episodeAt = (number: number) =>
  assertDefined(
    ShowDevsSeasonEpisodesResponseMock.find((entry) => entry.number === number),
  );

export const ShowDevsProgressResponseMock: ShowProgressResponse = {
  'aired': 8,
  'completed': WATCHED,
  'last_watched_at': '2025-01-20T21:04:00.000Z',
  'reset_at': null,
  'stats': STATS,
  'seasons': [
    {
      'number': 1,
      'title': null,
      'aired': 8,
      'completed': WATCHED,
      'stats': STATS,
      'episodes': ShowDevsSeasonEpisodesResponseMock.map(({ number }) => ({
        'number': number,
        'completed': number <= WATCHED,
        'last_watched_at': number <= WATCHED
          ? '2025-01-20T21:04:00.000Z'
          : null,
      })),
    },
  ],
  'hidden_seasons': [],
  'next_episode': episodeAt(WATCHED + 1),
  'last_episode': episodeAt(WATCHED),
};
