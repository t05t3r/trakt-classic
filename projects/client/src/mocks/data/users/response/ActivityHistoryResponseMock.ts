import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { MovieHereticResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticResponseMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import type { ActivityHistoryResponse } from '@trakt/api';

export const ActivityHistoryResponseMock: ActivityHistoryResponse[] = [
  {
    'id': 1,
    'watched_at': '2025-01-31T23:12:41.000Z',
    'action': 'watch',
    'type': 'episode',
    'episode': EpisodeSiloResponseMock,
    'show': ShowSiloResponseMock,
  },
  {
    'id': 2,
    'watched_at': '2025-01-31T23:12:41.000Z',
    'action': 'watch',
    'type': 'movie',
    'movie': MovieHereticResponseMock,
  },
];
