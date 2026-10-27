import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { toExternalLinks } from './toExternalLinks.ts';

describe('toExternalLinks', () => {
  it('should link the official site, IMDb and TMDB of a movie', () => {
    const links = toExternalLinks({
      homepage: 'https://www.topgunmovie.com/',
      imdbId: 'tt1745960',
      tmdbId: 361743,
      type: 'movie',
    });

    expect(links).toEqual([
      {
        key: 'official',
        label: 'Official Site',
        href: 'https://www.topgunmovie.com/',
      },
      {
        key: 'imdb',
        label: 'IMDb',
        href: 'https://www.imdb.com/title/tt1745960',
      },
      {
        key: 'tmdb',
        label: 'TMDB',
        href: 'https://www.themoviedb.org/movie/361743',
      },
    ]);
  });

  it('should link a show on TMDB as a TV title', () => {
    const links = toExternalLinks({ tmdbId: 124364, type: 'show' });

    expect(links).toEqual([
      {
        key: 'tmdb',
        label: 'TMDB',
        href: 'https://www.themoviedb.org/tv/124364',
      },
    ]);
  });

  it("should link an episode on IMDb, and on TMDB under its show's id", () => {
    const links = toExternalLinks({
      type: 'episode',
      imdbId: 'tt14693272',
      tmdbId: 125988,
      season: 1,
      episode: 1,
    });

    expect(links).toEqual([
      {
        key: 'imdb',
        label: 'IMDb',
        href: 'https://www.imdb.com/title/tt14693272',
      },
      {
        key: 'tmdb',
        label: 'TMDB',
        href: 'https://www.themoviedb.org/tv/125988/season/1/episode/1',
      },
    ]);
  });

  it("should link a season on IMDb and TMDB under its show's ids", () => {
    const links = toExternalLinks({
      type: 'season',
      imdbId: 'tt14688458',
      tmdbId: 125988,
      season: 2,
    });

    expect(links).toEqual([
      {
        key: 'imdb',
        label: 'IMDb',
        href: 'https://www.imdb.com/title/tt14688458/episodes?season=2',
      },
      {
        key: 'tmdb',
        label: 'TMDB',
        href: 'https://www.themoviedb.org/tv/125988/season/2',
      },
    ]);
  });

  it("should not link a season to its show's official site", () => {
    const links = toExternalLinks({
      ...ShowSiloMappedMock,
      type: 'season',
      season: 1,
    });

    expect(links.map(({ key }) => key)).toEqual(['imdb', 'tmdb']);
  });

  it('should leave out every link the title has no id for', () => {
    expect(toExternalLinks({ homepage: null, imdbId: null, type: 'show' }))
      .toEqual([]);
  });
});
