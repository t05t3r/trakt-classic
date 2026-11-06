import type { ListItem } from '$lib/requests/models/ListItem.ts';
import { itemOfType } from '$test/beds/dashboard/itemOfType.ts';
import { describe, expect, it } from 'vitest';
import { toListItemPoster } from './toListItemPoster.ts';

function thumbOf(item: ListItem) {
  return toListItemPoster(item).url.thumb;
}

describe('util: toListItemPoster', () => {
  it("should give a movie's own poster", () => {
    expect(thumbOf(itemOfType('movie'))).toBe(
      '/img/movies/000/259/852/posters/thumb/edaa502030.jpg.webp',
    );
  });

  it("should give a show's own poster", () => {
    expect(thumbOf(itemOfType('show'))).toBe(
      '/img/shows/000/155/534/posters/thumb/6b6d40b6de.jpg.webp',
    );
  });

  it("should give a season's own poster when it has one", () => {
    expect(thumbOf(itemOfType('season'))).toBe(
      '/img/seasons/000/456/019/posters/thumb/279e86a7d7.jpg.webp',
    );
  });

  it("should give the show's poster for a season without one", () => {
    const season = itemOfType('season');
    const withoutPoster: ListItem = {
      ...season,
      entry: {
        ...season.entry,
        season: { ...season.entry.season, poster: undefined },
      },
    };

    expect(thumbOf(withoutPoster)).toBe(
      '/img/shows/000/180/770/posters/thumb/279e86a7d7.jpg.webp',
    );
  });

  it("should give the show's poster for an episode", () => {
    expect(thumbOf(itemOfType('episode'))).toBe(
      '/img/shows/000/154/574/posters/thumb/5fea83a517.jpg.webp',
    );
  });

  describe('of a media card input', () => {
    it("should give a movie's own poster", () => {
      const movie = itemOfType('movie').entry;

      expect(toListItemPoster({ type: 'movie', movie }).url.thumb).toBe(
        '/img/movies/000/259/852/posters/thumb/edaa502030.jpg.webp',
      );
    });

    it("should give a show's own poster", () => {
      const show = itemOfType('show').entry;

      expect(toListItemPoster({ type: 'show', show }).url.thumb).toBe(
        '/img/shows/000/155/534/posters/thumb/6b6d40b6de.jpg.webp',
      );
    });

    it("should give a season's own poster when it has one", () => {
      const { entry } = itemOfType('season');

      expect(toListItemPoster({ type: 'season', ...entry }).url.thumb).toBe(
        '/img/seasons/000/456/019/posters/thumb/279e86a7d7.jpg.webp',
      );
    });

    it("should give the show's poster for a season without one", () => {
      const { show, season } = itemOfType('season').entry;

      expect(
        toListItemPoster({
          type: 'season',
          show,
          season: { ...season, poster: undefined },
        }).url.thumb,
      ).toBe('/img/shows/000/180/770/posters/thumb/279e86a7d7.jpg.webp');
    });

    it("should give the show's poster for an episode", () => {
      const { entry } = itemOfType('episode');

      expect(toListItemPoster({ type: 'episode', ...entry }).url.thumb).toBe(
        '/img/shows/000/154/574/posters/thumb/5fea83a517.jpg.webp',
      );
    });
  });
});
