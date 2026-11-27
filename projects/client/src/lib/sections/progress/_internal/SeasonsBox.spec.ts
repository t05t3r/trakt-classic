import { SILO_PROGRESS_URL } from '$mocks/data/shows/SILO_PROGRESS_URL.ts';
import { SILO_SEASONS_URL } from '$mocks/data/shows/SILO_SEASONS_URL.ts';
import { SILO_SEASON_TWO_EPISODES_URL } from '$mocks/data/shows/SILO_SEASON_TWO_EPISODES_URL.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloProgressHiddenSeasonTwoResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressHiddenSeasonTwoResponseMock.ts';
import { ShowSiloSeasonTwoEpisodesResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonTwoEpisodesResponseMock.ts';
import { ShowSiloProgressResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressResponseMock.ts';
import { HIDE_PROGRESS_URL } from '$mocks/data/users/HIDE_PROGRESS_URL.ts';
import { siloSeasonBody } from '$mocks/data/users/siloSeasonBody.ts';
import { UNHIDE_PROGRESS_URL } from '$mocks/data/users/UNHIDE_PROGRESS_URL.ts';
import { server } from '$mocks/server.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { time } from '$lib/utils/timing/time.ts';
import { waitForEnabled } from '$test/beds/buttons/waitForEnabled.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { answerDialog } from '$test/beds/dialogs/answerDialog.ts';
import { controlledBy } from '$test/beds/dom/controlledBy.ts';
import { glyphClasses } from '$test/beds/menus/glyphClasses.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { openSeasons } from '$test/beds/progress/openSeasons.ts';
import SeasonsBoxHost from '$test/beds/progress/SeasonsBoxHost.svelte';
import { serveSiloHidingSeasonTwo } from '$test/beds/progress/serveSiloHidingSeasonTwo.ts';
import { serveSiloProgress } from '$test/beds/progress/serveSiloProgress.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { ageLoadedData } from '$test/beds/query/ageLoadedData.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { failOnce } from '$test/beds/request/failOnce.ts';
import { holdPost } from '$test/beds/request/holdPost.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { recordBodies } from '$test/beds/request/recordBodies.ts';
import { bodyUnlocked } from '$test/beds/scroll-lock/bodyUnlocked.ts';
import { screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

async function renderBox() {
  const { container: box, userLoaded, rerender } = renderComponent(
    SeasonsBoxHost,
    { props: { show: ShowSiloMappedMock } },
  );
  await userLoaded;

  const toggle = within(box).getByRole('button', { name: 'Seasons' });

  return { box, toggle, rerender };
}

const seasonLinks = (box: HTMLElement) =>
  within(box).queryAllByRole('link').map((link) => link.textContent?.trim());

// The only season the show has, hidden; the hidden=true read lists it.
function serveSeasonTwoAlone() {
  server.use(
    http.get(SILO_PROGRESS_URL, ({ request }) => {
      const hidden = new URL(request.url).searchParams.get('hidden');
      const [, seasonTwo] = ShowSiloProgressResponseMock.seasons;

      return HttpResponse.json({
        ...ShowSiloProgressHiddenSeasonTwoResponseMock,
        seasons: hidden === 'true' ? [assertDefined(seasonTwo)] : [],
      });
    }),
  );
}

async function pressSeasonMenu(
  { box, season, item }: { box: HTMLElement; season: number; item: string },
) {
  await userEvent.click(
    await waitForEnabled(
      await within(box).findByRole('button', {
        name: `Season ${season} actions`,
      }),
    ),
  );
  await userEvent.click(await screen.findByRole('menuitem', { name: item }));
}

async function openSeasonOne(box: HTMLElement) {
  await userEvent.click(within(box).getByRole('button', { name: 'Seasons' }));
  await within(box).findByRole('link', { name: 'Season 1' });
}

const seasonToggle = (box: HTMLElement, season: number) =>
  within(box).getByRole('button', { name: `Episodes of season ${season}` });

// Unhides the last hidden season, Season 2, landing while the box is closed, and reopens it with the read that follows held.
async function unhideBeforeTheRead() {
  serveSiloHidingSeasonTwo();
  const unhide = holdPost(UNHIDE_PROGRESS_URL, 200);
  const { box, toggle } = await renderBox();
  await openSeasonOne(box);
  await userEvent.click(
    await within(box).findByRole('button', { name: '1 hidden season' }),
  );
  await within(box).findByRole('link', { name: 'Season 2' });
  serveSiloProgress(ShowSiloProgressResponseMock);
  await pressSeasonMenu({ box, season: 2, item: 'Unhide Season 2' });
  await unhide.requested;
  await bodyUnlocked();
  await userEvent.click(toggle);
  unhide.release();
  const read = holdRequest({ method: 'get', url: SILO_PROGRESS_URL });
  await userEvent.click(toggle);

  return { box, read };
}

describe('component: SeasonsBox', () => {
  beforeEach(() => {
    stubClientRects();
  });

  it('should read no season before it opens', async () => {
    const requests = await captureRequests(async () => {
      const { box, toggle } = await renderBox();
      await waitNegativeClaim();

      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(seasonLinks(box)).toEqual([]);
    }, { pathIncludes: '/shows/silo' });

    expect(requests).toEqual([]);
  });

  it("should read the show's progress and seasons on its first open, then list a row per season", async () => {
    const { box, toggle } = await renderBox();

    const requests = await captureRequests(async () => {
      await openSeasons(box);
    }, { pathIncludes: '/shows/silo' });

    expect(requests.toSorted()).toEqual([
      'GET /shows/silo/progress/watched',
      'GET /shows/silo/seasons',
    ]);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(seasonLinks(box)).toEqual(['Season 1', 'Season 2']);
  });

  it("should read no season's episodes on its own", async () => {
    const { box } = await renderBox();

    const requests = await captureRequests(async () => {
      await openSeasons(box);
      await waitNegativeClaim();
    }, { pathIncludes: '/shows/silo/seasons/' });

    expect(requests).toEqual([]);
  });

  it('should close its rows on a second press', async () => {
    const { box, toggle } = await renderBox();
    await openSeasons(box);

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(seasonLinks(box)).toEqual([]);
  });

  it('should read busy while the progress loads', async () => {
    const progress = holdRequest({ method: 'get', url: SILO_PROGRESS_URL });
    const { box, toggle } = await renderBox();

    await userEvent.click(toggle);
    await progress.requested;

    const list = assertDefined(box.querySelector('.trakt-status-frame'));
    expect(list).toHaveAttribute('aria-busy', 'true');
    expect(list.querySelector('.trakt-pending-spinner')).not.toBeNull();

    progress.release();

    await within(box).findByRole('link', { name: 'Season 2' });
    expect(list).toHaveAttribute('aria-busy', 'false');
  });

  it('should offer a retry when the progress fails, then list the seasons', async () => {
    failOnce(SILO_PROGRESS_URL);
    const { box, toggle } = await renderBox();

    await userEvent.click(toggle);
    await userEvent.click(
      await within(box).findByRole('button', { name: 'Retry' }),
    );

    await waitFor(() =>
      expect(seasonLinks(box)).toEqual(['Season 1', 'Season 2'])
    );
  });

  it('should offer a retry when the seasons fail, then list the seasons', async () => {
    failOnce(SILO_SEASONS_URL);
    const { box, toggle } = await renderBox();

    await userEvent.click(toggle);
    await userEvent.click(
      await within(box).findByRole('button', { name: 'Retry' }),
    );

    await waitFor(() =>
      expect(seasonLinks(box)).toEqual(['Season 1', 'Season 2'])
    );
  });

  it('should say so when the progress lists no season', async () => {
    serveSiloProgress({ ...ShowSiloProgressResponseMock, seasons: [] });
    const { box, toggle } = await renderBox();

    await userEvent.click(toggle);

    expect(await within(box).findByText('No seasons.')).toBeVisible();
  });

  it('should offer its one toggle', async () => {
    const { box } = await renderBox();

    expect(within(box).getAllByRole('button')).toHaveLength(1);
  });

  it('should be described by the row, and control the seasons list', async () => {
    const { container, userLoaded } = renderComponent(SeasonsBoxHost, {
      props: { show: ShowSiloMappedMock, describedBy: 'row-title' },
    });
    await userLoaded;
    const toggle = within(container).getByRole('button', { name: 'Seasons' });

    expect(toggle).toHaveAttribute('aria-describedby', 'row-title');
    expect(controlledBy(toggle)).toHaveClass('trakt-seasons-list');
  });

  it('should mark its list open only while open, the state its phone gap turns on', async () => {
    const { toggle } = await renderBox();
    const list = assertDefined(controlledBy(toggle));
    const closed = list.classList.contains('is-open');

    await userEvent.click(toggle);

    expect([closed, list.classList.contains('is-open')]).toEqual([false, true]);
  });

  describe("a season's toggle", () => {
    it("should list that season's episodes alone, reading only that season", async () => {
      const { box } = await renderBox();
      await openSeasons(box);

      const requests = await captureRequests(async () => {
        await userEvent.click(seasonToggle(box, 2));
        await within(box).findByRole('link', { name: '2x07 The Flamekeepers' });
      }, { pathIncludes: '/shows/silo/seasons/' });

      expect(requests).toEqual(['GET /shows/silo/seasons/2']);
      const episodes = assertDefined(controlledBy(seasonToggle(box, 2)));
      // Seven aired, then the three the season lists past them.
      expect(within(episodes).getAllByRole('link')).toHaveLength(10);
      expect(within(box).queryByRole('link', { name: /^1x01/ })).toBeNull();
    });

    it('should name a square by its sxe and state until the titles land', async () => {
      const episodes = holdRequest({
        method: 'get',
        url: SILO_SEASON_TWO_EPISODES_URL,
      });
      const { box } = await renderBox();
      await openSeasons(box);

      await userEvent.click(seasonToggle(box, 2));
      await episodes.requested;

      const square = await within(box).findByRole('link', {
        name: '2x02, Up next',
      });

      episodes.release();

      await waitFor(() =>
        expect(square).toHaveAccessibleName("2x02 Holston's Pick, Up next")
      );
    });

    it('should offer no watch toggle on an episode', async () => {
      const { box } = await renderBox();
      await openSeasons(box);

      await userEvent.click(seasonToggle(box, 2));
      await within(box).findByRole('link', { name: '2x07 The Flamekeepers' });

      expect(
        within(box).queryByRole('button', { name: /^Mark "2x/ }),
      ).toBeNull();
    });

    it('should offer neither toggle on a season with no aired episode', async () => {
      server.use(
        http.get(
          `http://localhost/shows/${ShowSiloMappedMock.slug}/seasons/3`,
          () =>
            HttpResponse.json([
              {
                ...assertDefined(ShowSiloSeasonTwoEpisodesResponseMock.at(0)),
                season: 3,
                title: 'TBA',
              },
            ]),
        ),
      );
      serveSiloProgress({
        ...ShowSiloProgressResponseMock,
        seasons: [
          ...ShowSiloProgressResponseMock.seasons,
          {
            ...assertDefined(ShowSiloProgressResponseMock.seasons.at(1)),
            number: 3,
            aired: 0,
            completed: 0,
            episodes: [],
          },
        ],
      });
      const { box } = await renderBox();
      await openSeasons(box);

      const unaired = assertDefined(
        within(box).getByRole('link', { name: 'Season 3' }).parentElement,
      );
      // Its menu stays, since a season not yet aired can be hidden.
      expect(
        within(unaired).getAllByRole('button').map((button) =>
          button.getAttribute('aria-label')
        ),
      ).toEqual(['Season 3 actions']);
      expect(seasonToggle(box, 2)).toBeVisible();
      // With no toggle, its announced episodes show from the start.
      expect(
        await within(box).findByRole('link', {
          name: '3x01 TBA, Airs 5 May 2023',
        }),
      )
        .toHaveAttribute('data-state', 'announced');
    });

    it('should collapse its episodes on a second press', async () => {
      const { box } = await renderBox();
      await openSeasons(box);
      await userEvent.click(seasonToggle(box, 2));
      await within(box).findByRole('link', { name: '2x07 The Flamekeepers' });

      await userEvent.click(seasonToggle(box, 2));

      expect(seasonToggle(box, 2)).toHaveAttribute('aria-expanded', 'false');
      expect(within(box).queryByRole('link', { name: /^2x07/ })).toBeNull();
    });
  });

  describe('hidden seasons', () => {
    it('should offer no hidden seasons toggle while none is hidden', async () => {
      const { box } = await renderBox();

      await openSeasons(box);

      expect(within(box).queryByRole('button', { name: /hidden season/ }))
        .toBeNull();
    });

    it('should count them after its toggle once the progress is read, leaving them out of the list', async () => {
      serveSiloHidingSeasonTwo();
      const { box, toggle } = await renderBox();

      await openSeasonOne(box);

      const hidden = await within(box).findByRole('button', {
        name: '1 hidden season',
      });
      expect(toggle.nextElementSibling).toBe(hidden);
      expect(hidden).toHaveAttribute('aria-pressed', 'false');
      expect(glyphClasses(hidden)).toEqual([
        expect.stringContaining('tabler-icon-ban'),
      ]);
      expect(seasonLinks(box)).toEqual(['Season 1']);
    });

    it('should list them, marked, from a read of every season made only once pressed', async () => {
      const hiddenReads = serveSiloHidingSeasonTwo();
      const { box } = await renderBox();
      await openSeasonOne(box);
      const hidden = await within(box).findByRole('button', {
        name: '1 hidden season',
      });
      await waitNegativeClaim();
      expect(hiddenReads).not.toContain('true');

      await userEvent.click(hidden);

      const link = await within(box).findByRole('link', { name: 'Season 2' });
      expect(hidden).toHaveAttribute('aria-pressed', 'true');
      expect(hiddenReads).toContain('true');
      expect(seasonLinks(box)).toEqual(['Season 1', 'Season 2']);
      expect(link.closest('.trakt-season-row')).toHaveClass('is-hidden');
    });

    it('should open the box with them from a press while it is closed', async () => {
      serveSiloHidingSeasonTwo();
      const { box, toggle } = await renderBox();
      await openSeasonOne(box);
      const hidden = await within(box).findByRole('button', {
        name: '1 hidden season',
      });
      await userEvent.click(toggle);

      await userEvent.click(hidden);

      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(await within(box).findByRole('link', { name: 'Season 2' }))
        .toBeVisible();
    });

    it('should take a season out of the list and count it while its hide from its menu is in flight', async () => {
      const write = holdPost(HIDE_PROGRESS_URL);
      const { box } = await renderBox();
      await openSeasons(box);

      await pressSeasonMenu({ box, season: 1, item: 'Hide Season 1' });
      await write.requested;

      expect(write.bodies).toEqual([siloSeasonBody(1)]);
      expect(seasonLinks(box)).toEqual(['Season 2']);
      expect(within(box).getByRole('button', { name: '1 hidden season' }))
        .toBeVisible();
      write.release();
    });

    it('should move focus to the hidden seasons toggle when a hide takes its row out of the list', async () => {
      const write = holdPost(HIDE_PROGRESS_URL);
      const { box } = await renderBox();
      await openSeasons(box);

      await pressSeasonMenu({ box, season: 1, item: 'Hide Season 1' });
      await write.requested;

      const hiddenToggle = within(box).getByRole('button', {
        name: '1 hidden season',
      });
      await waitFor(() => expect(hiddenToggle).toHaveFocus());
      await waitNegativeClaim();
      expect(hiddenToggle).toHaveFocus();
      write.release();
    });

    it("should return focus to a season's menu when its hide keeps the row listed", async () => {
      serveSiloHidingSeasonTwo();
      const write = holdPost(HIDE_PROGRESS_URL);
      const { box } = await renderBox();
      await openSeasonOne(box);
      await userEvent.click(
        await within(box).findByRole('button', { name: '1 hidden season' }),
      );
      const menu = await waitForEnabled(
        await within(box).findByRole('button', { name: 'Season 1 actions' }),
      );

      await userEvent.click(menu);
      await userEvent.click(
        await screen.findByRole('menuitem', { name: 'Hide Season 1' }),
      );
      await answerDialog('Hide the whole show?', 'Yes, hide it!');
      await write.requested;

      await waitFor(() =>
        expect(within(box).getByRole('button', { name: 'Season 1 actions' }))
          .toHaveFocus()
      );
      write.release();
    });

    it('should return focus to the menu when the hide of the last visible season is declined', async () => {
      serveSiloHidingSeasonTwo();
      const { box } = await renderBox();
      await openSeasonOne(box);
      await pressSeasonMenu({ box, season: 1, item: 'Hide Season 1' });

      await answerDialog('Hide the whole show?', 'No');

      const menu = within(box).getByRole('button', {
        name: 'Season 1 actions',
      });
      await waitFor(() => expect(menu).toHaveFocus());
      await waitNegativeClaim();
      expect(menu).toHaveFocus();
      expect(seasonLinks(box)).toEqual(['Season 1']);
    });

    it('should still hide the last visible season when its row leaves before the answer', async () => {
      serveSiloHidingSeasonTwo();
      const bodies = recordBodies(HIDE_PROGRESS_URL, { status: 201 });
      const { box, rerender } = await renderBox();
      await openSeasonOne(box);
      await pressSeasonMenu({ box, season: 1, item: 'Hide Season 1' });
      await screen.findByRole('dialog', { name: 'Hide the whole show?' });

      await rerender({ show: ShowSiloMappedMock, isMounted: false });
      await answerDialog('Hide the whole show?', 'Yes, hide it!');

      await waitFor(() => expect(bodies).toEqual([siloSeasonBody(1)]));
    });

    it('should move focus to the hidden seasons toggle when a confirmed hide takes the last row out', async () => {
      serveSiloHidingSeasonTwo();
      const write = holdPost(HIDE_PROGRESS_URL);
      const { box } = await renderBox();
      await openSeasonOne(box);
      await pressSeasonMenu({ box, season: 1, item: 'Hide Season 1' });

      await answerDialog('Hide the whole show?', 'Yes, hide it!');
      await write.requested;

      const hiddenToggle = within(box).getByRole('button', {
        name: '2 hidden seasons',
      });
      await waitFor(() => expect(hiddenToggle).toHaveFocus());
      await waitNegativeClaim();
      expect(hiddenToggle).toHaveFocus();
      write.release();
    });

    it('should leave focus on the menu when a hide leaves its own season listed', async () => {
      const write = holdPost(HIDE_PROGRESS_URL);
      const { box } = await renderBox();
      await openSeasons(box);

      await pressSeasonMenu({
        box,
        season: 1,
        item: 'Hide every season after Season 1',
      });
      await write.requested;

      const menu = within(box).getByRole('button', {
        name: 'Season 1 actions',
      });
      await waitFor(() => expect(menu).toHaveFocus());
      await waitNegativeClaim();
      expect(menu).toHaveFocus();
      write.release();
    });

    it('should move focus to its toggle when a first hide fails', async () => {
      const write = holdPost(HIDE_PROGRESS_URL, 500);
      const { box, toggle } = await renderBox();
      await openSeasons(box);
      await pressSeasonMenu({ box, season: 1, item: 'Hide Season 1' });
      await waitFor(() =>
        expect(within(box).getByRole('button', { name: '1 hidden season' }))
          .toHaveFocus()
      );

      write.release();

      await waitFor(() => expect(toggle).toHaveFocus());
      expect(seasonLinks(box)).toEqual(['Season 1', 'Season 2']);
      expect(within(box).queryByRole('button', { name: /hidden season/ }))
        .toBeNull();
    });

    it('should say no season is listed while every season is hidden, and list them once shown', async () => {
      serveSeasonTwoAlone();
      const { box } = await renderBox();
      await userEvent.click(
        within(box).getByRole('button', { name: 'Seasons' }),
      );
      expect(await within(box).findByText('No seasons.')).toBeVisible();
      expect(within(box).queryByRole('list')).toBeNull();

      await userEvent.click(
        within(box).getByRole('button', { name: '1 hidden season' }),
      );

      expect(await within(box).findByRole('link', { name: 'Season 2' }))
        .toBeVisible();
      expect(within(box).queryByText('No seasons.')).toBeNull();
      expect(within(box).getByRole('button', { name: 'Season 2 actions' }))
        .toBeVisible();
    });

    it('should wait for the hidden seasons, saying so', async () => {
      serveSiloHidingSeasonTwo();
      const { box } = await renderBox();
      await openSeasonOne(box);
      const read = holdRequest({ method: 'get', url: SILO_PROGRESS_URL });

      await userEvent.click(
        await within(box).findByRole('button', { name: '1 hidden season' }),
      );
      await read.requested;

      expect(box.querySelector('[aria-busy="true"]')).not.toBeNull();
      expect(seasonLinks(box)).toEqual(['Season 1']);
      read.release();
      expect(await within(box).findByRole('link', { name: 'Season 2' }))
        .toBeVisible();
      expect(box.querySelector('[aria-busy="true"]')).toBeNull();
    });

    it('should offer to retry hidden seasons that fail to load', async () => {
      serveSiloHidingSeasonTwo();
      const { box } = await renderBox();
      await openSeasonOne(box);
      const hidden = await within(box).findByRole('button', {
        name: '1 hidden season',
      });
      failOnce(SILO_PROGRESS_URL);

      await userEvent.click(hidden);

      await userEvent.click(
        await within(box).findByRole('button', { name: 'Retry' }),
      );
      expect(await within(box).findByRole('link', { name: 'Season 2' }))
        .toBeVisible();
    });

    it('should keep the last hidden season listed, its menu focused, while its unhide is in flight', async () => {
      serveSiloHidingSeasonTwo();
      const write = holdPost(UNHIDE_PROGRESS_URL, 200);
      const { box } = await renderBox();
      await openSeasonOne(box);
      await userEvent.click(
        await within(box).findByRole('button', { name: '1 hidden season' }),
      );
      await within(box).findByRole('link', { name: 'Season 2' });

      await pressSeasonMenu({ box, season: 2, item: 'Unhide Season 2' });
      await write.requested;

      const menu = within(box).getByRole('button', {
        name: 'Season 2 actions',
      });
      await waitFor(() => expect(menu).toHaveFocus());
      expect(seasonLinks(box)).toEqual(['Season 1', 'Season 2']);
      expect(
        within(box).getByRole('link', { name: 'Season 2' })
          .closest('.trakt-season-row'),
      ).not.toHaveClass('is-hidden');

      serveSiloProgress(ShowSiloProgressResponseMock);
      write.release();
      await waitForEnabled(menu);
      await waitNegativeClaim();
      expect(seasonLinks(box)).toEqual(['Season 1', 'Season 2']);
      expect(menu).toHaveFocus();
    });

    it('should bring its toggle back unpressed, the newly hidden season left out, once the last hidden season left', async () => {
      serveSiloHidingSeasonTwo();
      recordBodies(UNHIDE_PROGRESS_URL);
      const write = holdPost(HIDE_PROGRESS_URL);
      const { box } = await renderBox();
      await openSeasonOne(box);
      await userEvent.click(
        await within(box).findByRole('button', { name: '1 hidden season' }),
      );
      await within(box).findByRole('link', { name: 'Season 2' });
      serveSiloProgress(ShowSiloProgressResponseMock);
      await pressSeasonMenu({ box, season: 2, item: 'Unhide Season 2' });
      await waitFor(() =>
        expect(within(box).queryByRole('button', { name: /hidden season/ }))
          .toBeNull()
      );

      await pressSeasonMenu({ box, season: 1, item: 'Hide Season 1' });
      await write.requested;

      expect(within(box).getByRole('button', { name: '1 hidden season' }))
        .toHaveAttribute('aria-pressed', 'false');
      expect(seasonLinks(box)).toEqual(['Season 2']);
      write.release();
    });

    it('should bring its toggle back unpressed, the unhidden season still listed, when a hide comes before the read that follows the last unhide', async () => {
      const { box, read } = await unhideBeforeTheRead();
      const write = holdPost(HIDE_PROGRESS_URL);

      await pressSeasonMenu({ box, season: 1, item: 'Hide Season 1' });
      await answerDialog('Hide the whole show?', 'Yes, hide it!');
      await write.requested;

      const hiddenToggle = within(box).getByRole('button', {
        name: '1 hidden season',
      });
      expect(hiddenToggle).toHaveAttribute('aria-pressed', 'false');
      expect(seasonLinks(box)).toEqual(['Season 2']);
      expect(within(box).queryByText('No seasons.')).toBeNull();
      const link = within(box).getByRole('link', { name: 'Season 2' });
      read.release();
      await waitNegativeClaim();
      // The same link: its row never left the list as the read moved it to its visible place.
      expect(within(box).getByRole('link', { name: 'Season 2' })).toBe(link);
      expect(seasonLinks(box)).toEqual(['Season 2']);
      expect(hiddenToggle).toHaveAttribute('aria-pressed', 'false');
      write.release();
    });

    it('should keep the unhidden season listed when the hide that comes before the read that follows the last unhide is declined', async () => {
      const { box, read } = await unhideBeforeTheRead();

      await pressSeasonMenu({ box, season: 1, item: 'Hide Season 1' });
      await answerDialog('Hide the whole show?', 'No');

      expect(seasonLinks(box)).toEqual(['Season 1', 'Season 2']);
      expect(within(box).queryByRole('button', { name: /hidden season/ }))
        .toBeNull();
      read.release();
    });

    it('should leave its toggle pressed and the rows as they were when the hide of the last visible season is declined', async () => {
      serveSiloHidingSeasonTwo();
      const { box } = await renderBox();
      await openSeasonOne(box);
      const hidden = await within(box).findByRole('button', {
        name: '1 hidden season',
      });
      await userEvent.click(hidden);
      await within(box).findByRole('link', { name: 'Season 2' });

      await pressSeasonMenu({ box, season: 1, item: 'Hide Season 1' });
      await answerDialog('Hide the whole show?', 'No');

      expect(hidden).toHaveAttribute('aria-pressed', 'true');
      expect(seasonLinks(box)).toEqual(['Season 1', 'Season 2']);
    });

    it('should bring its toggle back pressed, the season listed and its menu focused, when the unhide of the last hidden season fails', async () => {
      serveSiloHidingSeasonTwo();
      const write = holdPost(UNHIDE_PROGRESS_URL, 500);
      const { box } = await renderBox();
      await openSeasonOne(box);
      await userEvent.click(
        await within(box).findByRole('button', { name: '1 hidden season' }),
      );
      await within(box).findByRole('link', { name: 'Season 2' });
      await pressSeasonMenu({ box, season: 2, item: 'Unhide Season 2' });
      await write.requested;
      const menu = within(box).getByRole('button', {
        name: 'Season 2 actions',
      });
      await waitFor(() => expect(menu).toHaveFocus());

      write.release();

      expect(
        await within(box).findByRole('button', { name: '1 hidden season' }),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(seasonLinks(box)).toEqual(['Season 1', 'Season 2']);
      expect(
        within(box).getByRole('link', { name: 'Season 2' })
          .closest('.trakt-season-row'),
      ).toHaveClass('is-hidden');
      await waitForEnabled(menu);
      expect(menu).toHaveFocus();
    });

    it('should bring its toggle back unpressed when a later read finds a season hidden after the last one was unhidden', async () => {
      serveSiloHidingSeasonTwo();
      recordBodies(UNHIDE_PROGRESS_URL);
      const { box, toggle } = await renderBox();
      await openSeasonOne(box);
      await userEvent.click(
        await within(box).findByRole('button', { name: '1 hidden season' }),
      );
      await within(box).findByRole('link', { name: 'Season 2' });
      serveSiloProgress(ShowSiloProgressResponseMock);
      await pressSeasonMenu({ box, season: 2, item: 'Unhide Season 2' });
      await waitForEnabled(
        within(box).getByRole('button', { name: 'Season 2 actions' }),
      );
      expect(within(box).queryByRole('button', { name: /hidden season/ }))
        .toBeNull();
      await bodyUnlocked();
      await userEvent.click(toggle);
      serveSiloProgress(ShowSiloProgressHiddenSeasonTwoResponseMock);
      ageLoadedData(time.hours(4));

      await userEvent.click(toggle);

      expect(
        await within(box).findByRole('button', { name: '1 hidden season' }),
      ).toHaveAttribute('aria-pressed', 'false');
      expect(seasonLinks(box)).toEqual(['Season 1']);
    });

    it('should unhide a hidden season from its menu', async () => {
      serveSiloHidingSeasonTwo();
      const bodies = recordBodies(UNHIDE_PROGRESS_URL);
      const { box } = await renderBox();
      await openSeasonOne(box);
      await userEvent.click(
        await within(box).findByRole('button', { name: '1 hidden season' }),
      );

      await pressSeasonMenu({ box, season: 2, item: 'Unhide Season 2' });

      await waitFor(() => expect(bodies).toEqual([siloSeasonBody(2)]));
    });
  });
});
