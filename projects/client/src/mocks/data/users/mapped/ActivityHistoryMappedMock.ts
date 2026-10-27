import type { ActivityHistory } from '$lib/requests/queries/users/activityHistoryQuery.ts';
import { EpisodeSiloMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloMappedMock.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';

export const ActivityHistoryMappedMock: ActivityHistory[] = [
  {
    'id': 1,
    'key': 'episode-1',
    'episode': EpisodeSiloMappedMock,
    'show': ShowSiloMappedMock,
    'type': 'episode',
    'watchedAt': new Date('2025-01-31T23:12:41.000Z'),
  },
  {
    'id': 2,
    'key': 'movie-2',
    'movie': MovieHereticMappedMock,
    'type': 'movie',
    'watchedAt': new Date('2025-01-31T23:12:41.000Z'),
  },
];
