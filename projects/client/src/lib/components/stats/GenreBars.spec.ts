import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import GenreBars from './GenreBars.svelte';
import type { GenreBar } from './GenreBarsProps.ts';

const START_AT = '2026-09-11';

type GenreBarParams = {
  key: string;
  name: string;
  share: number;
  episodes?: [number, number];
  shows?: number;
  movies?: [number, number];
};

const historyOf = (type: string, key: string) =>
  `/users/me/history/${type}?genres=${key}&start_at=${START_AT}` as const;

function genreBar(
  { key, name, share, episodes = [0, 0], shows = 0, movies = [0, 0] }:
    GenreBarParams,
): GenreBar {
  return {
    key,
    name,
    share,
    episodes: {
      distinct: episodes[0],
      plays: episodes[1],
      href: historyOf('episodes', key),
    },
    shows: { distinct: shows, href: historyOf('shows', key) },
    movies: {
      distinct: movies[0],
      plays: movies[1],
      href: historyOf('movies', key),
    },
  };
}

const DRAMA = genreBar({
  key: 'drama',
  name: 'Drama',
  share: 68 / 190,
  episodes: [66, 66],
  shows: 6,
  movies: [2, 2],
});

const THRILLER = genreBar({
  key: 'thriller',
  name: 'Thriller',
  share: 30 / 190,
  episodes: [30, 30],
  shows: 2,
});

const FANTASY = genreBar({
  key: 'fantasy',
  name: 'Fantasy',
  share: 0.25,
  episodes: [25, 25],
});

function renderBars(genres: ReadonlyArray<GenreBar>) {
  return render(GenreBars, { props: { genres } });
}

describe('component: GenreBars', () => {
  it("should link each count into that type's history, episodes, shows, then movies", () => {
    renderBars([DRAMA]);

    const links = screen.getAllByRole('link');

    expect(links.map((link) => link.textContent)).toEqual([
      '66 episodes',
      '6 shows',
      '2 movies',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      historyOf('episodes', 'drama'),
      historyOf('shows', 'drama'),
      historyOf('movies', 'drama'),
    ]);
  });

  it('should leave out a type with no count', () => {
    renderBars([THRILLER]);

    expect(screen.getAllByRole('link').map((link) => link.textContent))
      .toEqual(['30 episodes', '2 shows']);
  });

  it('should follow an episode or movie count with its plays when they are higher', () => {
    renderBars([genreBar({
      key: 'comedy',
      name: 'Comedy',
      share: 0.1,
      episodes: [1234, 1500],
      shows: 1,
      movies: [1, 2],
    })]);

    expect(screen.getAllByRole('link').map((link) => link.textContent))
      .toEqual(['1,234 episodes (1,500)', '1 show', '1 movie (2)']);
  });

  it('should name each count link by its genre and its count', () => {
    renderBars([DRAMA, THRILLER]);

    expect(
      screen.getAllByRole('link').map((link) =>
        link.getAttribute('aria-label')
      ),
    )
      .toEqual([
        'Drama: 66 episodes',
        'Drama: 6 shows',
        'Drama: 2 movies',
        'Thriller: 30 episodes',
        'Thriller: 2 shows',
      ]);
  });

  it("should spell a count's plays out in its link's name when they are higher", () => {
    renderBars([genreBar({
      key: 'drama',
      name: 'Drama',
      share: 0.5,
      episodes: [66, 70],
      shows: 6,
      movies: [1, 2],
    })]);

    const links = screen.getAllByRole('link');

    expect(links.map((link) => link.getAttribute('aria-label'))).toEqual([
      'Drama: 66 episodes, 70 plays',
      'Drama: 6 shows',
      'Drama: 1 movie, 2 plays',
    ]);
    expect(links.map((link) => link.textContent)).toEqual([
      '66 episodes (70)',
      '6 shows',
      '1 movie (2)',
    ]);
  });

  it("should show each genre's share as a whole percentage", () => {
    renderBars([DRAMA, THRILLER]);

    expect(screen.getByText('36%')).toBeInTheDocument();
    expect(screen.getByText('16%')).toBeInTheDocument();
  });

  it('should keep the separators between the counts outside the links', () => {
    renderBars([DRAMA]);
    const counts = screen.getByRole('link', { name: 'Drama: 66 episodes' })
      .parentElement;

    expect(counts).toHaveTextContent(/^66 episodes, 6 shows, 2 movies$/);
  });

  describe('bars', () => {
    const barOf = (name: string) =>
      screen.getByText(name).closest('.genre-bar');

    it('should size each bar by its share', () => {
      renderBars([FANTASY]);

      expect(barOf('Fantasy')).toHaveStyle({ '--share': '25%' });
    });

    it('should colour each bar by its rank', () => {
      renderBars([DRAMA, THRILLER, FANTASY]);

      expect(
        ['Drama', 'Thriller', 'Fantasy'].map((name) =>
          barOf(name)?.getAttribute('data-rank')
        ),
      ).toEqual(['1', '2', '3']);
    });

    it("should put every second bar's label below the row", () => {
      renderBars([DRAMA, THRILLER, FANTASY]);

      expect(barOf('Drama')).toHaveAttribute('data-label', 'above');
      expect(barOf('Thriller')).toHaveAttribute('data-label', 'below');
      expect(barOf('Fantasy')).toHaveAttribute('data-label', 'above');
    });

    it("should keep a genre's bar when the order changes", async () => {
      const { rerender } = renderBars([DRAMA, THRILLER]);
      const drama = barOf('Drama');

      await rerender({ genres: [THRILLER, DRAMA] });

      expect(barOf('Drama')).toBe(drama);
      expect(barOf('Drama')).toHaveAttribute('data-rank', '2');
    });
  });
});
