import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { MovieMatrixResponseMock } from '$mocks/data/summary/movies/matrix/MovieMatrixResponseMock.ts';
import { ShowSiloMinimalResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloMinimalResponseMock.ts';

export const ListItemIdsResponseMock = [
  {
    'rank': 1,
    'id': 2001,
    'listed_at': '2024-03-01T12:00:00.000Z',
    'notes': null,
    'my_rating': null,
    'type': 'movie',
    'movie': {
      'title': MovieMatrixResponseMock.title,
      'year': MovieMatrixResponseMock.year,
      'ids': MovieMatrixResponseMock.ids,
    },
  },
  {
    'rank': 2,
    'id': 2002,
    'listed_at': '2024-03-02T12:00:00.000Z',
    'notes': null,
    'my_rating': null,
    'type': 'episode',
    'show': ShowSiloMinimalResponseMock,
    'episode': {
      'season': EpisodeSiloResponseMock.season,
      'number': EpisodeSiloResponseMock.number,
      'title': EpisodeSiloResponseMock.title,
      'ids': EpisodeSiloResponseMock.ids,
    },
  },
];
