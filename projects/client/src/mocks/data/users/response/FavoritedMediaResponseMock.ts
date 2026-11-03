import { FavoritedMoviesResponseMock } from '$mocks/data/users/response/FavoritedMoviesResponseMock.ts';
import { FavoritedShowsResponseMock } from '$mocks/data/users/response/FavoritedShowsResponseMock.ts';

// The user's favourites of every type: the movies, then the shows.
export const FavoritedMediaResponseMock = [
  ...FavoritedMoviesResponseMock,
  ...FavoritedShowsResponseMock,
];
