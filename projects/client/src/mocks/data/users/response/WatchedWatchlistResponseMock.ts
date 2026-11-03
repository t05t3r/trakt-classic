import { MovieHereticResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticResponseMock.ts';
import { ShowDevsResponseMock } from '$mocks/data/summary/shows/devs/ShowDevsResponseMock.ts';
import { WatchlistPreviewResponseMock } from '$mocks/data/sync/response/WatchlistPreviewResponseMock.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';

function rowOfType(type: 'movie' | 'show') {
  return assertDefined(
    WatchlistPreviewResponseMock.find((row) => row.type === type),
  );
}

// The mocked history has played Heretic and every regular episode of Devs.
export const WatchedWatchlistResponseMock = [
  { ...rowOfType('movie'), movie: MovieHereticResponseMock },
  { ...rowOfType('show'), show: ShowDevsResponseMock },
];
