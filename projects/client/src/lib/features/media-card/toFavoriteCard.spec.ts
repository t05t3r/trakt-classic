import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { FavoritedMoviesMappedMock } from '$mocks/data/users/mapped/FavoritedMoviesMappedMock.ts';
import { FavoritedShowsMappedMock } from '$mocks/data/users/mapped/FavoritedShowsMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { toFavoriteCard } from './toFavoriteCard.ts';

describe('toFavoriteCard', () => {
  it('should map a favourite movie to its own card, poster and quick-icons Target', () => {
    const card = toFavoriteCard(assertDefined(FavoritedMoviesMappedMock.at(0)));

    expect({ ...card, poster: card.poster.url.thumb }).toEqual({
      media: { type: 'movie', title: 'Heretic', year: 2024 },
      href: '/movies/heretic-2024',
      poster: '/img/movies/000/916/302/posters/thumb/db9d66deb8.jpg.webp',
      posterTitle: 'Heretic',
      target: {
        type: 'movie',
        id: 916302,
        title: 'Heretic',
        airDate: new Date('2024-11-08T00:00:00.000Z'),
        runtime: 111,
      },
      rating: {
        value: 0.7218,
        earliestReleaseDate: new Date('2024-11-08T00:00:00.000Z'),
      },
    });
  });

  it('should map a favourite show to its own card, poster and quick-icons Target', () => {
    const card = toFavoriteCard(assertDefined(FavoritedShowsMappedMock.at(0)));

    expect({ ...card, poster: card.poster.url.thumb }).toEqual({
      media: { type: 'show', title: 'Silo' },
      href: '/shows/silo',
      poster: '/img/shows/000/180/770/posters/thumb/5312f1d1cf.jpg.webp',
      posterTitle: 'Silo',
      target: {
        type: 'show',
        id: 180770,
        title: 'Silo',
        slug: 'silo',
        airDate: new Date('2023-05-05T01:00:00.000Z'),
        episode: { count: 15 },
      },
      rating: {
        value: 0.8161,
        earliestReleaseDate: new Date('2023-05-05T01:00:00.000Z'),
      },
    });
  });
});
