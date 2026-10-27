import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloProgressMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloProgressMappedMock.ts';
import { ShowSiloSeasonsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsMappedMock.ts';
import { ShowSiloSeasonsWithSpecialsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsWithSpecialsMappedMock.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { screen, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { SeasonsBlockProps } from './_internal/SeasonsBlockProps.ts';
import SeasonsBlock from './SeasonsBlock.svelte';

// The list icon renders only once a layout matches.
const setLayout = fakeLayouts({ desktop: WELL_KNOWN_MEDIA_QUERY.desktop });

const SHOW_PATH = '/shows/silo';

async function renderBlock(props: Partial<SeasonsBlockProps> = {}) {
  const rendered = renderComponent(SeasonsBlock, {
    props: {
      show: ShowSiloMappedMock,
      status: { kind: 'ready', data: ShowSiloSeasonsMappedMock },
      progress: ShowSiloProgressMappedMock,
      count: 3,
      ...props,
    },
  });
  await screen.findByRole('heading', { level: 2 });
  return rendered;
}

function heading() {
  return screen.getByRole('heading', { level: 2 });
}

function cardTitles() {
  return screen.getAllByRole('heading', { level: 3 })
    .map((title) => title.textContent?.trim());
}

function cardOf(container: HTMLElement, title: string): HTMLElement {
  const card = [...container.querySelectorAll<HTMLElement>('.sortable-item')]
    .find((cell) => cell.querySelector('h3')?.textContent?.trim() === title);
  if (!card) throw new Error(`no card titled ${title}`);
  return card;
}

describe('component: SeasonsBlock', () => {
  it('should title the block with the count in strong', async () => {
    openAt(SHOW_PATH);
    await renderBlock({ count: 3 });

    expect(heading()).toHaveTextContent('3 Seasons');
    expect(heading().querySelector('strong')).toHaveTextContent('3');
  });

  it('should read Season for one season', async () => {
    openAt(SHOW_PATH);
    await renderBlock({ count: 1 });

    expect(heading()).toHaveTextContent('1 Season');
    expect(heading()).not.toHaveTextContent('Seasons');
  });

  it('should read the label alone while the count is unknown', async () => {
    openAt(SHOW_PATH);
    await renderBlock({ status: { kind: 'loading' }, count: undefined });

    expect(heading()).toHaveTextContent(/^Seasons$/);
    expect(heading().querySelector('strong')).toBeNull();
  });

  it('should list the seasons by number, highest first, by default', async () => {
    openAt(SHOW_PATH);
    await renderBlock();

    expect(cardTitles()).toEqual(['Season 3', 'Season 2', 'Season 1']);
  });

  it('should sort the seasons as the URL asks', async () => {
    openAt(`${SHOW_PATH}?seasons=number,asc`);
    await renderBlock();

    expect(cardTitles()).toEqual(['Season 1', 'Season 2', 'Season 3']);
  });

  it('should list Number, Rating and Air date in the sort menu', async () => {
    stubClientRects();
    openAt(SHOW_PATH);
    await renderBlock();

    await userEvent.click(
      screen.getByRole('button', { name: 'Sort by: Number' }),
    );
    const menu = await screen.findByRole('menu', { name: 'Sort by' });

    expect(
      within(menu).getAllByRole('menuitemradio').map((row) =>
        row.textContent?.trim()
      ),
    ).toEqual(['Number', 'Rating', 'Air date']);
  });

  it.each(['number,desc', 'rating,desc', 'aired,desc'])(
    'should leave the direction toggle unpressed at %s, its default direction',
    async (sort) => {
      openAt(`${SHOW_PATH}?seasons=${sort}`);
      await renderBlock();

      expect(screen.getByRole('button', { name: 'Direction' }))
        .toHaveAttribute('aria-pressed', 'false');
    },
  );

  // The column counts are CSS keyed on these properties.
  it('should lay the seasons out five, four, three and two across', async () => {
    openAt(SHOW_PATH);
    const { container } = await renderBlock();

    const grid = container.querySelector<HTMLElement>('.trakt-poster-grid');
    expect(
      [
        '--poster-grid-columns-desktop',
        '--poster-grid-columns-tablet-lg',
        '--poster-grid-columns-tablet-sm',
        '--poster-grid-columns-mobile',
      ].map((name) => grid?.style.getPropertyValue(name)),
    ).toEqual(['5', '4', '3', '2']);
  });

  it('should link a card to its season and print its episode count', async () => {
    openAt(SHOW_PATH);
    const { container } = await renderBlock();

    const card = cardOf(container, 'Season 3');
    expect(within(card).getByRole('link', { name: 'Season 3' }))
      .toHaveAttribute('href', '/shows/silo/seasons/3');
    expect(within(card).getByRole('heading', { level: 4 }))
      .toHaveTextContent(/^1 episode$/);
    expect(cardOf(container, 'Season 1').querySelector('h4'))
      .toHaveTextContent(/^10 episodes$/);
  });

  it('should leave the show line out of the cards', async () => {
    openAt(SHOW_PATH);
    await renderBlock();

    expect(screen.queryByRole('link', { name: ShowSiloMappedMock.title }))
      .toBeNull();
  });

  it("should set the viewer's rating in the corner of a rated season's poster only", async () => {
    openAt(SHOW_PATH);
    const { container } = await renderBlock();

    const rated = cardOf(container, 'Season 1');
    const corner = await within(rated).findByRole('img', {
      name: 'Your rating: 8',
    });

    expect(rated.querySelector('a.poster')).toContainElement(corner);
    expect(container.querySelectorAll('.trakt-corner-rating')).toHaveLength(1);
  });

  it('should give each season card, the specials included, watch and list icons named after the season and its show', async () => {
    stubClientRects();
    setLayout('desktop');
    openAt(SHOW_PATH);
    const { container } = await renderBlock({
      status: {
        kind: 'ready',
        data: ShowSiloSeasonsWithSpecialsMappedMock,
      },
    });

    const specialsCard = cardOf(container, 'Specials');
    await within(specialsCard).findByRole('button', {
      name: 'Add or remove "Specials of Silo" from lists',
    });

    expect(
      within(specialsCard).getAllByRole('button').map((icon) =>
        icon.getAttribute('aria-label')
      ),
    ).toEqual([
      'Mark "Specials of Silo" as watched',
      'Add or remove "Specials of Silo" from lists',
    ]);
    expect(
      within(cardOf(container, 'Season 1')).getByRole('button', {
        name: 'Mark "Season 1 of Silo" as watched',
      }),
    ).toHaveAttribute('data-action', 'watch');
  });

  it('should show the watched share of each season under its poster', async () => {
    openAt(SHOW_PATH);
    const { container } = await renderBlock();

    const bar = within(cardOf(container, 'Season 2')).getByRole('progressbar');
    expect(bar).toHaveAccessibleName('1 of 7 episodes watched');
    expect(bar).toHaveAttribute('aria-valuenow', '14');
  });

  it("should keep the bar's room but hide it while nothing is watched", async () => {
    openAt(SHOW_PATH);
    const { container } = await renderBlock({
      progress: {
        ...ShowSiloProgressMappedMock,
        seasons: [{ number: 1, total: 10, completed: 0, lastWatchedAt: null }],
      },
    });

    const card = cardOf(container, 'Season 1');
    expect(within(card).queryByRole('progressbar')).toBeNull();
    expect(card.querySelector('.titles')).toHaveClass('has-progress');
  });

  it("should keep the bar's room on the specials but show no bar", async () => {
    openAt(SHOW_PATH);
    const { container } = await renderBlock({
      status: {
        kind: 'ready',
        data: ShowSiloSeasonsWithSpecialsMappedMock,
      },
    });

    const card = cardOf(container, 'Specials');
    expect(within(card).queryByRole('progressbar')).toBeNull();
    expect(card.querySelector('.titles')).toHaveClass('has-progress');
  });

  it('should fade the watched seasons under Fade watched', async () => {
    openAt(`${SHOW_PATH}?fade=watched`);
    const { container } = await renderBlock();

    expect(cardOf(container, 'Season 1')).toHaveClass('is-faded');
    expect(cardOf(container, 'Season 2')).not.toHaveClass('is-faded');
    expect(cardOf(container, 'Season 3')).not.toHaveClass('is-faded');
  });

  it('should not count a season with no aired episodes as watched', async () => {
    openAt(`${SHOW_PATH}?fade=watched`);
    const { container } = await renderBlock({
      progress: {
        ...ShowSiloProgressMappedMock,
        seasons: [{ number: 3, total: 0, completed: 0, lastWatchedAt: null }],
      },
    });

    expect(cardOf(container, 'Season 3')).not.toHaveClass('is-faded');
  });

  it('should hide the watched seasons and keep the count', async () => {
    openAt(`${SHOW_PATH}?hide=watched`);
    await renderBlock({ count: 3 });

    expect(cardTitles()).toEqual(['Season 3', 'Season 2']);
    expect(heading()).toHaveTextContent('3 Seasons');
  });

  describe('with the specials and season 1 watched', () => {
    const watchedProps: Partial<SeasonsBlockProps> = {
      status: {
        kind: 'ready',
        data: ShowSiloSeasonsWithSpecialsMappedMock,
      },
      progress: {
        ...ShowSiloProgressMappedMock,
        seasons: [
          {
            number: SPECIALS,
            total: 10,
            completed: 10,
            lastWatchedAt: ShowSiloProgressMappedMock.lastWatchedAt,
          },
          {
            number: 1,
            total: 10,
            completed: 10,
            lastWatchedAt: ShowSiloProgressMappedMock.lastWatchedAt,
          },
        ],
      },
    };

    it('should never fade the specials under Fade watched', async () => {
      openAt(`${SHOW_PATH}?fade=watched`);
      const { container } = await renderBlock(watchedProps);

      expect(cardOf(container, 'Season 1')).toHaveClass('is-faded');
      expect(cardOf(container, 'Specials')).not.toHaveClass('is-faded');
    });

    it('should never hide the specials under Hide watched', async () => {
      openAt(`${SHOW_PATH}?hide=watched`);
      await renderBlock(watchedProps);

      expect(cardTitles()).toEqual(['Season 3', 'Season 2', 'Specials']);
    });
  });

  it('should say so when the show has no seasons', async () => {
    openAt(SHOW_PATH);
    await renderBlock({ status: { kind: 'empty' } });

    expect(screen.getByText('No seasons.')).toBeInTheDocument();
  });
});
