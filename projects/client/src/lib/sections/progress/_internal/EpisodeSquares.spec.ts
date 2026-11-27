import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { SILO_SEASON_TWO_EPISODES_URL } from '$mocks/data/shows/SILO_SEASON_TWO_EPISODES_URL.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloProgressMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloProgressMappedMock.ts';
import { ShowSiloSeasonTwoEpisodesResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonTwoEpisodesResponseMock.ts';
import { server } from '$mocks/server.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { tooltipOf } from '$test/beds/tooltip/tooltipOf.ts';
import { waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import EpisodeSquares from './EpisodeSquares.svelte';

const SEASON_TWO = assertDefined(ShowSiloProgressMappedMock.seasons.at(1));

async function renderSquares(show = ShowSiloMappedMock) {
  const { container, userLoaded } = renderComponent(EpisodeSquares, {
    props: { show, season: SEASON_TWO },
  });
  await userLoaded;

  const list = assertDefined(
    container.querySelector<HTMLElement>('.trakt-episode-squares'),
  );
  await within(list).findByRole('link', {
    name: '2x10 Outside, Airs 30 Jun 2023',
  });

  return list;
}

describe('component: EpisodeSquares', () => {
  beforeEach(() => {
    stubClientRects();
  });

  it("should link each of the season's episodes to its page by its number, named by its sxe, title and state", async () => {
    const list = await renderSquares();

    const squares = within(list).getAllByRole('link');
    expect(squares).toHaveLength(10);
    expect(squares.at(0)).toHaveAccessibleName('2x01 Freedom Day, Watched');
    expect(squares.at(0)).toHaveTextContent(/^1$/);
    expect(squares.at(0)).toHaveAttribute(
      'href',
      '/shows/silo/seasons/2/episodes/1',
    );
  });

  it('should mark each square watched, up next, unwatched or announced', async () => {
    const list = await renderSquares();

    expect(
      within(list).getAllByRole('link').map((square) =>
        square.getAttribute('data-state')
      ),
    ).toEqual([
      'watched',
      'next',
      'unwatched',
      'unwatched',
      'unwatched',
      'unwatched',
      'unwatched',
      'announced',
      'announced',
      'announced',
    ]);
  });

  it("should show the up next episode's screenshot, tag, title, air date, runtime and rating on hover", async () => {
    const list = await renderSquares();
    const square = within(list).getByRole('link', {
      name: "2x02 Holston's Pick, Up next",
    });

    await userEvent.hover(square);

    await waitFor(() =>
      expect(square).toHaveAccessibleDescription(
        /Up next.*2x02 Holston's Pick.*5 May 2023.*48m.*77%/,
      )
    );
    expect(within(tooltipOf(square)).getByRole('img'))
      .toHaveAccessibleName('Silo 2x02 screenshot');
    expect(
      tooltipOf(square).querySelector(
        '.hover-card-screenshot > .trakt-art-ribbon',
      ),
    ).toHaveTextContent(/^Up next$/);
  });

  it("should strip no other episode's screenshot", async () => {
    const list = await renderSquares();
    const [watched, , unwatched] = within(list).getAllByRole('link');

    await userEvent.hover(assertDefined(watched));
    await waitFor(() =>
      expect(watched).toHaveAccessibleDescription(/2x01 Freedom Day/)
    );
    expect(tooltipOf(assertDefined(watched)).querySelector('.trakt-art-ribbon'))
      .toBeNull();

    await userEvent.unhover(assertDefined(watched));
    await userEvent.hover(assertDefined(unwatched));
    await waitFor(() =>
      expect(unwatched).toHaveAccessibleDescription(/2x03 Machines/)
    );
    expect(
      tooltipOf(assertDefined(unwatched)).querySelector('.trakt-art-ribbon'),
    ).toBeNull();
  });

  it("should draw the rating in its pill's own type, beside the date and runtime pills", async () => {
    const list = await renderSquares();
    const square = within(list).getByRole('link', {
      name: "2x02 Holston's Pick, Up next",
    });

    await userEvent.hover(square);

    const rating = await waitFor(() =>
      assertDefined(
        tooltipOf(square).querySelector('.trakt-community-rating'),
      )
    );
    expect(rating).toHaveAttribute('data-variant', 'inline');
    expect(rating.parentElement).toHaveClass('trakt-outline-badge');
  });

  it("should end a watched episode's card with the day it was watched and its runtime, and an unwatched one's with its pills", async () => {
    const list = await renderSquares();
    const [watched, next] = within(list).getAllByRole('link');

    await userEvent.hover(assertDefined(watched));

    await waitFor(() =>
      expect(watched).toHaveAccessibleDescription(
        /2x01 Freedom Day .* Watched on 27 Dec 2024 1h$/,
      )
    );
    expect(within(tooltipOf(assertDefined(watched))).getByText('27 Dec 2024'))
      .toHaveProperty('tagName', 'B');

    await userEvent.unhover(assertDefined(watched));
    await userEvent.hover(assertDefined(next));

    await waitFor(() =>
      expect(next).toHaveAccessibleDescription(/2x02 Holston's Pick.*77%$/)
    );
  });

  it('should show no runtime for an episode Trakt gives none', async () => {
    server.use(
      http.get(SILO_SEASON_TWO_EPISODES_URL, () =>
        HttpResponse.json(
          ShowSiloSeasonTwoEpisodesResponseMock.map((entry) => ({
            ...entry,
            runtime: null,
          })),
        )),
    );
    const list = await renderSquares({ ...ShowSiloMappedMock, runtime: NaN });
    const [watched] = within(list).getAllByRole('link');

    await userEvent.hover(assertDefined(watched));

    await waitFor(() =>
      expect(watched).toHaveAccessibleDescription(/Watched on 27 Dec 2024$/)
    );
    expect(tooltipOf(assertDefined(watched))).not.toHaveTextContent('0m');
  });

  it('should show an announced episode by its title and the day it airs, with no screenshot', async () => {
    server.use(
      http.get(SILO_SEASON_TWO_EPISODES_URL, () =>
        HttpResponse.json(
          ShowSiloSeasonTwoEpisodesResponseMock.map((entry) =>
            entry.number === 10
              ? {
                ...entry,
                title: 'TBA',
                first_aired: '2027-07-09T01:00:00.000Z',
              }
              : entry
          ),
        )),
    );
    const { container, userLoaded } = renderComponent(EpisodeSquares, {
      props: { show: ShowSiloMappedMock, season: SEASON_TWO },
    });
    await userLoaded;
    const square = await within(container).findByRole('link', {
      name: '2x10 TBA, Airs 9 Jul 2027',
    });

    await userEvent.hover(square);

    await waitFor(() =>
      expect(square).toHaveAccessibleDescription('2x10 TBA Airs 9 Jul 2027')
    );
    expect(within(tooltipOf(square)).queryByRole('img')).toBeNull();
  });

  it("should close a square's hover card as the pointer moves on to the next square", async () => {
    const user = userEvent.setup();
    const list = await renderSquares();
    const [first, second] = within(list).getAllByRole('link');
    await user.hover(assertDefined(first));
    await waitFor(() =>
      expect(first).toHaveAccessibleDescription(/2x01 Freedom Day/)
    );

    await user.hover(assertDefined(second));

    await waitFor(() =>
      expect(second).toHaveAccessibleDescription(/2x02 Holston's Pick/)
    );
    expect(first).not.toHaveAccessibleDescription();
    expect(document.querySelectorAll('[data-tooltip-content]')).toHaveLength(1);
  });
});
