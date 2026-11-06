import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { MovieActivityHistoryMappedMock } from '$mocks/data/users/mapped/MovieActivityHistoryMappedMock.ts';
import { ShowActivityHistoryMappedMock } from '$mocks/data/users/mapped/ShowActivityHistoryMappedMock.ts';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import HistoryItemBanner from './HistoryItemBanner.svelte';

const PLAYED_MOVIE = assertDefined(MovieActivityHistoryMappedMock.at(0));
const PLAY = assertDefined(ShowActivityHistoryMappedMock.at(0));

const SCREENSHOT = 'https://walter.trakt.tv/screenshot.jpg';
const SHOW_FANART_THUMB = 'https://walter.trakt.tv/fanart-thumb.jpg';
const MOVIE_FANART_THUMB = 'https://walter.trakt.tv/movie-fanart-thumb.jpg';

const PLAYED_EPISODE = {
  ...PLAY,
  episode: {
    ...PLAY.episode,
    season: 3,
    number: 5,
    title: 'Memory',
    year: 2026,
    cover: { url: { ...PLAY.episode.cover.url, thumb: SCREENSHOT } },
  },
  show: {
    ...PLAY.show,
    cover: { url: { ...PLAY.show.cover.url, thumb: SHOW_FANART_THUMB } },
  },
};

const PLAYED_FANART_MOVIE = {
  ...PLAYED_MOVIE,
  movie: {
    ...PLAYED_MOVIE.movie,
    cover: {
      url: { ...PLAYED_MOVIE.movie.cover.url, thumb: MOVIE_FANART_THUMB },
    },
  },
};

const clearButton = () =>
  screen.getByRole('button', { name: 'Back to full history' });

const image = (container: HTMLElement) =>
  container.querySelector('img.image')?.getAttribute('src');

describe('component: HistoryItemBanner', () => {
  it.each(
    [
      {
        type: 'movie',
        entry: PLAYED_FANART_MOVIE,
        line: 'Displaying this movie',
        parent: undefined,
        title: 'Heretic',
        year: '2024',
        src: MOVIE_FANART_THUMB,
      },
      {
        type: 'episode',
        entry: PLAYED_EPISODE,
        line: 'Displaying this episode',
        parent: 'Silo / Season 3',
        title: '3x05 Memory',
        year: '2026',
        src: SCREENSHOT,
      },
      {
        type: 'show',
        entry: PLAYED_EPISODE,
        line: 'Displaying episodes from this show',
        parent: undefined,
        title: 'Silo',
        year: '2023',
        src: SHOW_FANART_THUMB,
      },
      {
        type: 'season',
        entry: PLAYED_EPISODE,
        line: 'Displaying episodes from this season',
        parent: 'Silo',
        title: 'Season 3',
        year: undefined,
        src: SHOW_FANART_THUMB,
      },
    ] as const,
  )(
    "should name a $type's plays from the first entry",
    ({ type, entry, line, parent, title, year, src }) => {
      const { container } = render(HistoryItemBanner, {
        props: {
          item: { type, id: 12 },
          entry,
          isEmpty: false,
          onClear: vi.fn(),
        },
      });

      expect(screen.getByText(line)).toBeVisible();
      expect(container.querySelector('.banner-parent')?.textContent)
        .toBe(parent);
      expect(container.querySelector('.banner-name')?.textContent).toBe(title);
      expect(container.querySelector('.banner-year')?.textContent).toBe(year);
      expect(image(container)).toBe(src);
    },
  );

  it.each(['movie', 'episode', 'show', 'season'] as const)(
    "should say a generic line, with no image, on a %s's empty list",
    (type) => {
      const { container } = render(HistoryItemBanner, {
        props: {
          item: { type, id: 12 },
          entry: undefined,
          isEmpty: true,
          onClear: vi.fn(),
        },
      });

      expect(screen.getByText('Displaying one title')).toBeVisible();
      expect(container.querySelector('img')).toBeNull();
      expect(clearButton()).toBeVisible();
    },
  );

  it("should keep the type's line and the X while the entries load", () => {
    const { container } = render(HistoryItemBanner, {
      props: {
        item: { type: 'show', id: 12 },
        entry: undefined,
        isEmpty: false,
        onClear: vi.fn(),
      },
    });

    expect(screen.getByText('Displaying episodes from this show'))
      .toBeVisible();
    expect(container.querySelector('.banner-name')).toBeNull();
    expect(clearButton()).toBeVisible();
  });

  it('should clear the filter from the X', async () => {
    const onClear = vi.fn();
    render(HistoryItemBanner, {
      props: {
        item: { type: 'movie', id: 12 },
        entry: PLAYED_MOVIE,
        isEmpty: false,
        onClear,
      },
    });

    await userEvent.click(clearButton());

    expect(onClear).toHaveBeenCalledOnce();
  });
});
