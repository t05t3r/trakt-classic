import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { MovieHereticResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticResponseMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import type { HotReleaseResponse } from '@trakt/api';

export const CalendarMediaResponseMock: HotReleaseResponse[] = [
  {
    'first_aired': '2023-05-05T01:00:00.000Z',
    'episode': EpisodeSiloResponseMock,
    'show': ShowSiloResponseMock,
  },
  {
    'released': '2024-11-08',
    'movie': MovieHereticResponseMock,
  },
];
