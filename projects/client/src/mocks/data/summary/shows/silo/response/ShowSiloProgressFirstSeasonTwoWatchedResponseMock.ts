import type { ShowProgressResponse } from '@trakt/api';
import { ShowSiloProgressResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressResponseMock.ts';

// Only the first two of its first season's episodes completed; the counts stay the base mock's.
export const ShowSiloProgressFirstSeasonTwoWatchedResponseMock:
  ShowProgressResponse = {
    ...ShowSiloProgressResponseMock,
    seasons: ShowSiloProgressResponseMock.seasons.map((season) =>
      season.number === 1
        ? {
          ...season,
          episodes: season.episodes.map((episode) => ({
            ...episode,
            completed: episode.number <= 2,
          })),
        }
        : season
    ),
  };
