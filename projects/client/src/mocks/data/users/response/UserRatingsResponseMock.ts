import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { MovieHereticResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticResponseMock.ts';
import { SeasonSiloResponseMock } from '$mocks/data/summary/seasons/silo/response/SeasonSiloResponseMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import type { RatedItemResponse } from '@trakt/api';

export const UserRatingsResponseMock: RatedItemResponse[] = [
  {
    'rated_at': '2025-01-16T17:39:23.000Z',
    'rating': 10,
    'type': 'movie',
    'movie': MovieHereticResponseMock,
  },
  {
    'rated_at': '2025-01-16T17:39:23.000Z',
    'rating': 9,
    'type': 'show',
    'show': ShowSiloResponseMock,
  },
  {
    'rated_at': '2025-01-16T17:41:12.000Z',
    'rating': 8,
    'type': 'season',
    'season': { ...SeasonSiloResponseMock, 'aired_episodes': 10 },
    'show': ShowSiloResponseMock,
  },
  {
    'rated_at': '2025-01-16T17:40:52.000Z',
    'rating': 7,
    'type': 'episode',
    'episode': EpisodeSiloResponseMock,
    'show': ShowSiloResponseMock,
  },
];
