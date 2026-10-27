import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloSeasonEpisodesMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonEpisodesMappedMock.ts';
import { WatchedShowsSiloResponseMock } from '$mocks/data/users/response/WatchedShowsSiloResponseMock.ts';
import { WATCHED_SHOWS_URL } from '$mocks/data/users/WATCHED_SHOWS_URL.ts';
import { server } from '$mocks/server.ts';
import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { emulateHydrated } from '$test/beds/hydration/emulateHydrated.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import type { EpisodesBlockProps } from './_internal/EpisodesBlockProps.ts';
import EpisodesBlock from './EpisodesBlock.svelte';

const SEASON_PATH = '/shows/silo/seasons/1';

async function renderBlock(props: Partial<EpisodesBlockProps> = {}) {
  const rendered = renderComponent(EpisodesBlock, {
    props: {
      show: ShowSiloMappedMock,
      status: { kind: 'ready', data: ShowSiloSeasonEpisodesMappedMock },
      count: 10,
      ...props,
    },
  });
  await screen.findByRole('heading', { level: 2 });
  return rendered;
}

function heading() {
  return screen.getByRole('heading', { level: 2 });
}

function underInfo(row: HTMLElement): HTMLElement {
  const info = row.querySelector<HTMLElement>('.under-info');
  if (!info) throw new Error('no title box in the row');
  return info;
}

function rows(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('.sortable-item')];
}

function rowTitles(container: HTMLElement) {
  return rows(container).map((row) =>
    underInfo(row).querySelector('h3')?.textContent?.trim()
  );
}

function rowOf(container: HTMLElement, sxe: string): HTMLElement {
  const row = rows(container).find((cell) =>
    underInfo(cell).querySelector('h3')?.textContent?.trim().startsWith(sxe)
  );
  if (!row) throw new Error(`no row for ${sxe}`);
  return row;
}

// Silo's history, which marks 1x01 and 1x02 as watched.
function serveSiloHistory() {
  server.use(
    http.get(
      WATCHED_SHOWS_URL,
      () => pagedResponse({ body: WatchedShowsSiloResponseMock }),
    ),
  );
}

// Holston's Pick, 1x02, aired 5 May 2023 01:00 UTC and runs 48 minutes.
const SECOND = assertDefined(ShowSiloSeasonEpisodesMappedMock.at(1));

function readyWith(episode: EpisodeEntry): Partial<EpisodesBlockProps> {
  return { status: { kind: 'ready', data: [episode] }, count: 1 };
}

function airLine(container: HTMLElement) {
  return underInfo(rowOf(container, '1x02')).querySelector('.air-line');
}

describe('component: EpisodesBlock', () => {
  it('should title the block with the count in strong', async () => {
    openAt(SEASON_PATH);
    await renderBlock({ count: 10 });

    expect(heading()).toHaveTextContent('10 Episodes');
    expect(heading().querySelector('strong')).toHaveTextContent('10');
  });

  it('should read Episode for one episode', async () => {
    openAt(SEASON_PATH);
    await renderBlock({ count: 1 });

    expect(heading()).toHaveTextContent('1 Episode');
    expect(heading()).not.toHaveTextContent('Episodes');
  });

  it('should read the label alone while the count is unknown', async () => {
    openAt(SEASON_PATH);
    await renderBlock({ status: { kind: 'loading' }, count: undefined });

    expect(heading()).toHaveTextContent(/^Episodes$/);
    expect(heading().querySelector('strong')).toBeNull();
  });

  it('should say so when the season has no episodes', async () => {
    openAt(SEASON_PATH);
    await renderBlock({ status: { kind: 'empty' }, count: 0 });

    expect(screen.getByText('No episodes yet.')).toBeInTheDocument();
  });

  it('should list the episodes by number, lowest first, by default', async () => {
    openAt(SEASON_PATH);
    const { container } = await renderBlock();

    expect(rowTitles(container).slice(0, 3)).toEqual([
      '1x01 Freedom Day',
      "1x02 Holston's Pick",
      '1x03 Machines',
    ]);
  });

  it('should sort the episodes as the URL asks', async () => {
    openAt(`${SEASON_PATH}?episodes=votes,asc`);
    const { container } = await renderBlock();

    expect(rowTitles(container).map((title) => title?.slice(0, 4))).toEqual([
      '1x09',
      '1x07',
      '1x08',
      '1x06',
      '1x05',
      '1x04',
      '1x10',
      '1x03',
      '1x02',
      '1x01',
    ]);
  });

  it('should list Number, Air date, Rating and Votes in the sort menu', async () => {
    stubClientRects();
    openAt(SEASON_PATH);
    await renderBlock();

    await userEvent.click(
      screen.getByRole('button', { name: 'Sort by: Number' }),
    );
    const menu = await screen.findByRole('menu', { name: 'Sort by' });

    expect(
      within(menu).getAllByRole('menuitemradio').map((row) =>
        row.textContent?.trim()
      ),
    ).toEqual(['Number', 'Air date', 'Rating', 'Votes']);
  });

  it.each(['number,asc', 'aired,asc', 'rating,desc', 'votes,desc'])(
    'should leave the direction toggle unpressed at %s, its default direction',
    async (sort) => {
      openAt(`${SEASON_PATH}?episodes=${sort}`);
      await renderBlock();

      expect(screen.getByRole('button', { name: 'Direction' }))
        .toHaveAttribute('aria-pressed', 'false');
    },
  );

  // The column counts are CSS keyed on these properties.
  it('should lay the rows out one across at every width, with no phone divider', async () => {
    openAt(SEASON_PATH);
    const { container } = await renderBlock();

    const grid = container.querySelector<HTMLElement>('.trakt-poster-grid');
    expect(
      [
        '--poster-grid-columns-desktop',
        '--poster-grid-columns-tablet-lg',
        '--poster-grid-columns-tablet-sm',
        '--poster-grid-columns-mobile',
      ].map((name) => grid?.style.getPropertyValue(name)),
    ).toEqual(['1', '1', '1', '1']);
    expect(grid).toHaveAttribute('data-phone-divider', 'none');
  });

  // Classic stacks the rows flush below 768px; the CSS is keyed on this mark.
  it('should stack the rows flush on phones', async () => {
    openAt(SEASON_PATH);
    const { container } = await renderBlock();

    expect(container.querySelector('.trakt-poster-grid'))
      .toHaveAttribute('data-phone-gaps', 'none');
  });

  it("should keep each card's titles for phones", async () => {
    openAt(SEASON_PATH);
    const { container } = await renderBlock();

    const cards = container.querySelectorAll('.trakt-fanart-card');
    expect(cards).toHaveLength(10);
    expect([...cards].every((card) => card.matches('[data-titles="phone"]')))
      .toBe(true);
  });

  it('should fade the watched episodes under Fade watched', async () => {
    serveSiloHistory();
    openAt(`${SEASON_PATH}?fade=watched`);
    const { container } = await renderBlock();

    await waitFor(() =>
      expect(rowOf(container, '1x01')).toHaveClass('is-faded')
    );
    expect(rowOf(container, '1x02')).toHaveClass('is-faded');
    expect(rowOf(container, '1x03')).not.toHaveClass('is-faded');
  });

  it('should hide the watched episodes and keep the count', async () => {
    serveSiloHistory();
    openAt(`${SEASON_PATH}?hide=watched`);
    const { container } = await renderBlock({ count: 10 });

    await waitFor(() => expect(rows(container)).toHaveLength(8));
    expect(rowTitles(container).at(0)).toBe('1x03 Machines');
    expect(heading()).toHaveTextContent('10 Episodes');
  });

  it("should link the row's title to the episode's page", async () => {
    openAt(SEASON_PATH);
    const { container } = await renderBlock();

    expect(
      within(underInfo(rowOf(container, '1x02'))).getByRole('link', {
        name: "1x02 Holston's Pick",
      }),
    ).toHaveAttribute('href', '/shows/silo/seasons/1/episodes/2');
  });

  it("should tag the row with the episode's type", async () => {
    openAt(SEASON_PATH);
    const { container } = await renderBlock();

    expect(underInfo(rowOf(container, '1x01'))).toHaveTextContent(
      'Series Premiere',
    );
  });

  it('should render no tag box on an episode with no tag', async () => {
    openAt(SEASON_PATH);
    const { container } = await renderBlock();

    expect(underInfo(rowOf(container, '1x01')).querySelector('.type-tag'))
      .not.toBeNull();
    expect(underInfo(rowOf(container, '1x02')).querySelector('.type-tag'))
      .toBeNull();
  });

  it('should print when the episode aired and its runtime once the app hydrates', async () => {
    openAt(SEASON_PATH);
    const { container } = await renderBlock();
    expect(airLine(container)).toBeNull();

    emulateHydrated();

    await waitFor(() =>
      expect(airLine(container)).toHaveTextContent(
        /^5 May 2023 01:00 — 48m$/,
      )
    );
  });

  it('should leave the runtime and its dash out when the episode has none', async () => {
    emulateHydrated();
    openAt(SEASON_PATH);
    const { container } = await renderBlock(
      readyWith({ ...SECOND, runtime: NaN }),
    );

    expect(airLine(container)).toHaveTextContent(/^5 May 2023 01:00$/);
  });

  it('should print the runtime alone when the episode has no air date', async () => {
    emulateHydrated();
    openAt(SEASON_PATH);
    const { container } = await renderBlock(
      readyWith({ ...SECOND, airDate: MAX_DATE }),
    );

    expect(airLine(container)).toHaveTextContent(/^48m$/);
  });

  it('should print the runtime alone when the air date is invalid', async () => {
    emulateHydrated();
    openAt(SEASON_PATH);
    const { container } = await renderBlock(
      readyWith({ ...SECOND, airDate: new Date(NaN) }),
    );

    expect(airLine(container)).toHaveTextContent(/^48m$/);
  });

  it("should show the episode's overview under its title", async () => {
    openAt(SEASON_PATH);
    const { container } = await renderBlock();

    expect(underInfo(rowOf(container, '1x02'))).toHaveTextContent(
      SECOND.overview,
    );
  });
});
