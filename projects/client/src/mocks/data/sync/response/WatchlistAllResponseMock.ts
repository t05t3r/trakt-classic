import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { MovieMatrixResponseMock } from '$mocks/data/summary/movies/matrix/MovieMatrixResponseMock.ts';
import { ShowSiloMinimalResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloMinimalResponseMock.ts';
import { ShowSiloSeasonsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsResponseMock.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';

const SILO_SEASON_1 = assertDefined(ShowSiloSeasonsResponseMock.at(0));

export const WatchlistAllResponseMock = [
  {
    'type': 'movie',
    'movie': {
      'title': MovieMatrixResponseMock.title,
      'year': MovieMatrixResponseMock.year,
      'ids': MovieMatrixResponseMock.ids,
    },
    'rank': 1,
    'id': 1001,
    'listed_at': '2024-01-01T12:00:00.000Z',
    'notes': null,
    'my_rating': null,
  },
  {
    'type': 'show',
    'show': ShowSiloMinimalResponseMock,
    'rank': 2,
    'id': 1002,
    'listed_at': '2024-01-02T12:00:00.000Z',
    'notes': null,
    'my_rating': null,
  },
  {
    'type': 'season',
    'show': ShowSiloMinimalResponseMock,
    'season': {
      'number': SILO_SEASON_1.number,
      'ids': SILO_SEASON_1.ids,
    },
    'rank': 3,
    'id': 1003,
    'listed_at': '2024-01-03T12:00:00.000Z',
    'notes': null,
    'my_rating': null,
  },
  {
    'type': 'episode',
    'show': ShowSiloMinimalResponseMock,
    'episode': {
      'season': EpisodeSiloResponseMock.season,
      'number': EpisodeSiloResponseMock.number,
      'title': EpisodeSiloResponseMock.title,
      'ids': EpisodeSiloResponseMock.ids,
    },
    'rank': 4,
    'id': 1004,
    'listed_at': '2024-01-04T12:00:00.000Z',
    'notes': null,
    'my_rating': null,
  },
];
