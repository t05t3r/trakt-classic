import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { DEVS } from '$mocks/data/media-actions/DEVS.ts';
import { MATRIX } from '$mocks/data/media-actions/MATRIX.ts';
import { WATCHLIST_URL } from '$mocks/data/sync/WATCHLIST_URL.ts';
import { LIST_RESPONSE } from '$mocks/data/users/LIST_RESPONSE.ts';
import { LISTS_EXACT_URL } from '$mocks/data/users/LISTS_EXACT_URL.ts';
import { server } from '$mocks/server.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import ListMenuHost from '$test/beds/media-actions/ListMenuHost.svelte';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { recordWrites } from '$test/beds/request/recordWrites.ts';
import { screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

const setLayout = fakeLayouts({
  desktop: WELL_KNOWN_MEDIA_QUERY.desktop,
  mobile: WELL_KNOWN_MEDIA_QUERY.mobile,
});

const UNLISTED_ID = 6789;
const NEW_LIST_ID = 6790;

// The default ids mock lists the Matrix in every list; this one lists nothing.
function serveLists() {
  server.use(
    http.get(LISTS_EXACT_URL, () =>
      pagedResponse({
        body: [
          LIST_RESPONSE,
          {
            ...LIST_RESPONSE,
            name: 'Watch next',
            ids: { trakt: UNLISTED_ID, slug: 'watch-next' },
          },
        ],
      })),
    http.get(
      `http://localhost/users/me/lists/${UNLISTED_ID}/items*`,
      () => pagedResponse({ body: [] }),
    ),
  );
}

const row = (name: string) => screen.getByRole('menuitemcheckbox', { name });
const watchlistRow = () => row('Watchlist');

const spinnerOf = (element: Element) =>
  element.querySelector('.tabler-icon-loader-2');

// An unknown row also reads aria-checked false, so wait for its spinner to go.
const settledRow = async (name: string, checked: boolean) => {
  await waitFor(() => {
    expect(row(name)).toHaveAttribute('aria-checked', String(checked));
    expect(spinnerOf(row(name))).toBeNull();
  });
  return row(name);
};

const trigger = () => screen.findByRole('button', { name: 'Lists' });

async function openMenu() {
  await userEvent.click(await trigger());
  return screen.findByRole('menu', { name: 'Add to list' });
}

describe('component: ListMenu', () => {
  beforeEach(() => {
    stubClientRects();
    serveLists();
  });

  describe('on desktop', () => {
    beforeEach(() => {
      setLayout('desktop');
    });

    it('should list Watchlist first, then the personal lists, each ticked from its store', async () => {
      renderComponent(ListMenuHost, { props: MATRIX });
      const menu = await openMenu();

      await waitFor(() => {
        expect(spinnerOf(menu)).toBeNull();
        expect(
          screen.getAllByRole('menuitemcheckbox').map((row) => [
            row.textContent?.trim(),
            row.getAttribute('aria-checked'),
          ]),
        ).toEqual([
          ['Watchlist', 'true'],
          ['My personal list', 'true'],
          ['Watch next', 'false'],
        ]);
      });
    });

    it('should keep the rows out of a list inside the menu', async () => {
      renderComponent(ListMenuHost, { props: MATRIX });
      const menu = await openMenu();

      expect(menu.querySelector('ul')).toHaveAttribute('role', 'none');
    });

    it('should show one spinner row under Watchlist, announced as loading, while the lists load', async () => {
      holdRequest({
        method: 'get',
        url: LISTS_EXACT_URL,
        answer: () => pagedResponse({ body: [] }),
      });
      renderComponent(ListMenuHost, { props: MATRIX });
      const menu = await openMenu();
      await waitFor(() =>
        expect(watchlistRow()).toHaveAttribute('aria-checked', 'true')
      );

      const spinners = menu.querySelectorAll('.tabler-icon-loader-2');

      expect(screen.getAllByRole('menuitemcheckbox')).toEqual([watchlistRow()]);
      expect(spinners).toHaveLength(1);
      expect(
        watchlistRow().compareDocumentPosition(assertDefined(spinners.item(0))),
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(within(menu).getByRole('status')).toHaveTextContent(
        'Loading lists',
      );
    });

    it.each([
      {
        name: 'Watch next',
        target: MATRIX,
        checked: false,
        write: `POST /users/me/lists/${UNLISTED_ID}/items`,
      },
      {
        name: 'My personal list',
        target: MATRIX,
        checked: true,
        write: `POST /users/me/lists/${LIST_RESPONSE.ids.trakt}/items/remove`,
      },
      {
        name: 'Watchlist',
        // Off the watchlist mock.
        target: DEVS,
        checked: false,
        write: 'POST /sync/watchlist',
      },
      {
        name: 'Watchlist',
        target: MATRIX,
        checked: true,
        write: 'POST /sync/watchlist/remove',
      },
    ])(
      'should send $write from $name when checked is $checked, and stay open',
      async ({ name, target, checked, write }) => {
        const writes = recordWrites();
        renderComponent(ListMenuHost, { props: target });
        const menu = await openMenu();

        await userEvent.click(await settledRow(name, checked));

        await waitFor(() => expect(writes).toEqual([write]));
        expect(menu).toBeVisible();
      },
    );

    it.each([
      {
        name: 'Watch next',
        url: `http://localhost/users/me/lists/${UNLISTED_ID}/items*`,
      },
      {
        name: 'Watchlist',
        url: WATCHLIST_URL,
      },
    ])(
      'should ignore a click on $name while its state is unknown',
      async ({ name, url }) => {
        const known = holdRequest({
          method: 'get',
          url,
          answer: () => pagedResponse({ body: [] }),
        });
        const writes = recordWrites();
        renderComponent(ListMenuHost, { props: MATRIX });
        const menu = await openMenu();
        const unknownRow = await screen.findByRole('menuitemcheckbox', {
          name,
        });

        await userEvent.click(unknownRow);

        expect(unknownRow).toHaveAttribute('aria-checked', 'false');
        expect(spinnerOf(unknownRow)).not.toBeNull();
        expect(menu).toBeVisible();
        known.release();
        await settledRow(name, false);
        await waitNegativeClaim();
        expect(writes).toEqual([]);
      },
    );

    it('should flip a row on click, before its write lands', async () => {
      const write = holdRequest({
        method: 'post',
        url: `http://localhost/users/me/lists/${UNLISTED_ID}/items`,
        answer: () => new HttpResponse(null, { status: 201 }),
      });
      const writes = recordWrites();
      renderComponent(ListMenuHost, { props: MATRIX });
      await openMenu();

      await userEvent.click(await settledRow('Watch next', false));

      await waitFor(() =>
        expect(row('Watch next')).toHaveAttribute('aria-checked', 'true')
      );
      expect(writes).toEqual([`POST /users/me/lists/${UNLISTED_ID}/items`]);

      // Its items read still lists nothing, so false again means it settled.
      write.release();
      await settledRow('Watch next', false);
    });

    it("should keep the clicked row's element while its toggle refetches the lists", async () => {
      renderComponent(ListMenuHost, { props: MATRIX });
      await openMenu();
      await settledRow('Watch next', false);
      // The refetch puts a new list first, so the clicked row's index moves.
      server.use(
        http.get(LISTS_EXACT_URL, () =>
          pagedResponse({
            body: [
              {
                ...LIST_RESPONSE,
                name: 'Up next',
                ids: { trakt: NEW_LIST_ID, slug: 'up-next' },
              },
              LIST_RESPONSE,
              {
                ...LIST_RESPONSE,
                name: 'Watch next',
                ids: { trakt: UNLISTED_ID, slug: 'watch-next' },
              },
            ],
          })),
      );

      const before = await settledRow('My personal list', true);
      await userEvent.click(before);
      await screen.findByRole('menuitemcheckbox', { name: 'Up next' });

      expect(row('My personal list')).toBe(before);
      // Its items read lists the Matrix, so true again means the write settled.
      await settledRow('My personal list', true);
    });
  });

  describe('on phones', () => {
    beforeEach(() => {
      setLayout('mobile');
    });

    const dialog = () => screen.queryByRole('dialog', { name: 'Add to list' });

    it('should open a modal titled Add to list with the rows as checkboxes', async () => {
      renderComponent(ListMenuHost, { props: MATRIX });

      const button = await trigger();
      await userEvent.click(button);

      expect(button).toHaveAttribute('aria-haspopup', 'dialog');
      const modal = await screen.findByRole('dialog', { name: 'Add to list' });
      expect(modal).toBeVisible();
      await waitFor(() => {
        expect(spinnerOf(modal)).toBeNull();
        expect(
          screen.getAllByRole('checkbox').map((row) => [
            row.textContent?.trim(),
            row.getAttribute('aria-checked'),
          ]),
        ).toEqual([
          ['Watchlist', 'true'],
          ['My personal list', 'true'],
          ['Watch next', 'false'],
        ]);
      });
    });

    // Safari drops the list role of a list with no markers unless it is explicit.
    it('should keep an explicit list role on the rows in the modal', async () => {
      renderComponent(ListMenuHost, { props: MATRIX });
      await userEvent.click(await trigger());
      const modal = await screen.findByRole('dialog', { name: 'Add to list' });

      expect(within(modal).getByRole('list')).toHaveAttribute('role', 'list');
    });

    it('should send the write from a checkbox row, and stay open', async () => {
      const writes = recordWrites();
      renderComponent(ListMenuHost, { props: MATRIX });
      await userEvent.click(await trigger());
      const modal = await screen.findByRole('dialog', { name: 'Add to list' });
      await waitFor(() => expect(spinnerOf(modal)).toBeNull());

      await userEvent.click(
        screen.getByRole('checkbox', { name: 'Watch next' }),
      );

      await waitFor(() =>
        expect(writes).toEqual([`POST /users/me/lists/${UNLISTED_ID}/items`])
      );
      expect(dialog()).toBeVisible();
    });

    it('should close the modal on Escape', async () => {
      renderComponent(ListMenuHost, { props: MATRIX });
      await userEvent.click(await trigger());
      await screen.findByRole('dialog', { name: 'Add to list' });

      await userEvent.keyboard('{Escape}');

      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    });

    it('should not reopen the modal when the layout leaves the phone and comes back', async () => {
      renderComponent(ListMenuHost, { props: MATRIX });
      await userEvent.click(await trigger());
      await screen.findByRole('dialog', { name: 'Add to list' });

      setLayout('desktop');
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Lists' })).toHaveAttribute(
          'aria-haspopup',
          'menu',
        )
      );
      setLayout('mobile');
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Lists' })).toHaveAttribute(
          'aria-haspopup',
          'dialog',
        )
      );

      expect(dialog()).not.toBeInTheDocument();
    });
  });
});
