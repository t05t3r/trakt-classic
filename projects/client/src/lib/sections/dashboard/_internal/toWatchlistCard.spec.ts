import { itemOfType } from '$test/beds/dashboard/itemOfType.ts';
import { describe, expect, it } from 'vitest';
import { toWatchlistCard } from './toWatchlistCard.ts';

describe('toWatchlistCard', () => {
  it('should map a movie to its own card, poster and quick-icons Target', () => {
    const card = toWatchlistCard(itemOfType('movie'));

    expect({ ...card, poster: card.poster.url.thumb }).toEqual({
      media: { type: 'movie', title: 'The Batman', year: 2022 },
      href: '/movies/the-batman-2022',
      poster: '/img/movies/000/259/852/posters/thumb/edaa502030.jpg.webp',
      posterTitle: 'The Batman',
      target: {
        type: 'movie',
        id: 259852,
        title: 'The Batman',
        airDate: new Date('2022-03-04T00:00:00.000Z'),
      },
      rating: {
        value: 0.7999,
        earliestReleaseDate: new Date('2022-03-04T00:00:00.000Z'),
      },
    });
    expect(card).not.toHaveProperty('episodeType');
  });

  it('should map a show to its own card, poster and quick-icons Target', () => {
    const card = toWatchlistCard(itemOfType('show'));

    expect({ ...card, poster: card.poster.url.thumb }).toEqual({
      media: { type: 'show', title: 'Slow Horses' },
      href: '/shows/slow-horses',
      poster: '/img/shows/000/155/534/posters/thumb/6b6d40b6de.jpg.webp',
      posterTitle: 'Slow Horses',
      target: {
        type: 'show',
        id: 155534,
        title: 'Slow Horses',
        slug: 'slow-horses',
        airDate: new Date('2022-04-01T04:00:00.000Z'),
        episode: { count: 34 },
      },
      rating: {
        value: 0.8515,
        earliestReleaseDate: new Date('2022-04-01T04:00:00.000Z'),
      },
    });
  });

  it('should map a season to its page, its show, its rating and its quick-icons Target', () => {
    const card = toWatchlistCard(itemOfType('season'));

    expect({ ...card, poster: card.poster.url.thumb }).toEqual({
      media: { type: 'season', show: 'Silo', number: 3 },
      href: '/shows/silo/seasons/3',
      showHref: '/shows/silo',
      poster: '/img/seasons/000/456/019/posters/thumb/279e86a7d7.jpg.webp',
      posterTitle: 'Silo',
      target: {
        type: 'season',
        id: 456019,
        title: 'Season 3 of Silo',
        number: 3,
        episodes: { count: 10, aired: 10 },
        airDate: new Date('2026-07-03T01:00:00.000Z'),
        show: { id: 180770, title: 'Silo' },
      },
      rating: {
        value: 0.823,
        earliestReleaseDate: new Date('2026-07-03T01:00:00.000Z'),
      },
    });
  });

  it("should map an episode to its page, its show's poster, its type and its Target", () => {
    const card = toWatchlistCard(itemOfType('episode'));

    expect({ ...card, poster: card.poster.url.thumb }).toEqual({
      media: {
        type: 'episode',
        show: 'House of the Dragon',
        season: 1,
        number: 1,
        title: 'The Heirs of the Dragon',
      },
      href: '/shows/house-of-the-dragon/seasons/1/episodes/1',
      showHref: '/shows/house-of-the-dragon',
      poster: '/img/shows/000/154/574/posters/thumb/5fea83a517.jpg.webp',
      posterTitle: 'House of the Dragon',
      episodeType: 'series_premiere',
      target: {
        type: 'episode',
        id: 4735526,
        title: 'The Heirs of the Dragon',
        season: 1,
        number: 1,
        show: { id: 154574, title: 'House of the Dragon' },
        airDate: new Date('2022-08-22T01:00:00.000Z'),
      },
      rating: {
        value: 0.7969,
        earliestReleaseDate: new Date('2022-08-22T01:00:00.000Z'),
      },
    });
  });
});
