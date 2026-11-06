import { usePageParam } from '$lib/features/view-params/stores/usePageParam.ts';
import { useDividers } from '$lib/stores/useDividers.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { RATINGS_PATH } from '$mocks/data/users/RATINGS_PATH.ts';
import { UserRatingsResponseMock } from '$mocks/data/users/response/UserRatingsResponseMock.ts';
import { USER_RATINGS_URL } from '$mocks/data/users/USER_RATINGS_URL.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { controlledBy } from '$test/beds/dom/controlledBy.ts';
import { openMenuByClick } from '$test/beds/menus/openMenuByClick.ts';
import { pickMenuRadio } from '$test/beds/menus/pickMenuRadio.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { failOnce } from '$test/beds/request/failOnce.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { followReplaces } from '$test/beds/url/followReplaces.svelte.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import RatingsPage from './RatingsPage.svelte';

type RenderPageParams =
  | { filters?: string; search?: string; follows?: never }
  // page.url then follows each replace the page makes.
  | { filters?: never; search?: never; follows: true };

async function renderPage(
  { filters = '', search = '', follows }: RenderPageParams = {},
) {
  if (follows) {
    followReplaces(RATINGS_PATH);
  } else {
    const path = filters === '' ? RATINGS_PATH : `${RATINGS_PATH}/${filters}`;
    openAt(`${path}${search}`);
  }
  const { container, rerender, userLoaded } = renderComponent(RatingsPage, {
    props: { filters },
  });
  await userLoaded;

  return { container, rerender };
}

const cells = (container: HTMLElement) =>
  container.querySelectorAll('.trakt-poster-grid > li');

const stat = (label: string) => screen.getByTitle(label);

const dayDivider = () =>
  screen.findByRole('button', { name: /^Thursday 16 January 2025/ });

const gear = () => screen.getByRole('button', { name: 'Options' });

const EMPTY = "You haven't rated anything yet.";
const EMPTY_FILTERED = 'Nothing matches these filters.';

beforeEach(() => {
  stubClientRects();
});

describe('section: RatingsPage', () => {
  describe('rows', () => {
    it('should show a card for each rating, with no title bar', async () => {
      const { container } = await renderPage();

      await waitFor(() => expect(cells(container)).toHaveLength(4));
      expect(container.querySelector('.trakt-list-title-bar')).toBeNull();
    });

    it('should draw the first rating as the cover, under the Ratings tab', async () => {
      const { container } = await renderPage();

      await waitFor(() =>
        expect(container.querySelector('img[data-position="cover"]'))
          .not.toBeNull()
      );
      expect(screen.getByRole('link', { name: 'Ratings' }))
        .toHaveAttribute('aria-current', 'page');
    });

    it('should draw Pagination over a later page', async () => {
      servePaged({
        url: USER_RATINGS_URL,
        body: UserRatingsResponseMock,
        page: 2,
        pageCount: 3,
      });
      await renderPage({ search: '?page=2' });

      expect(await screen.findAllByRole('navigation', { name: /^Pagination/ }))
        .toHaveLength(2);
    });
  });

  describe('dividers', () => {
    it('should divide the ratings by the day they were rated, with no time spent', async () => {
      const { container } = await renderPage();

      expect(await dayDivider()).toHaveTextContent(
        /^Thursday 16 January 2025$/,
      );
      expect(cells(container)).toHaveLength(4);
    });

    it('should run the cards on with no dividers while the toggle is off', async () => {
      const { container } = await renderPage();
      await dayDivider();

      await userEvent.click(
        screen.getByRole('button', { name: 'Toggle Dividers' }),
      );

      await waitFor(() =>
        expect(screen.queryByRole('button', { name: /^Thursday/ })).toBeNull()
      );
      expect(cells(container)).toHaveLength(4);
    });

    it('should open with no dividers when they are stored off', async () => {
      useDividers().setShown(false);
      const { container } = await renderPage();

      await waitFor(() => expect(cells(container)).toHaveLength(4));

      expect(screen.queryByRole('button', { name: /^Thursday/ })).toBeNull();
    });

    // Both pages are cached, so the swap to the second never shows a loading state.
    it('should show a hidden day again once the values change', async () => {
      servePaged({
        url: USER_RATINGS_URL,
        body: UserRatingsResponseMock,
        pageCount: 3,
      });
      await renderPage({ follows: true });
      const { replacePage } = await renderStore(() => usePageParam());
      await dayDivider();
      await replacePage(2);
      await dayDivider();
      await replacePage(1);
      await userEvent.click(await dayDivider());
      expect(await dayDivider()).toHaveAttribute('aria-expanded', 'false');

      await replacePage(2);

      await waitFor(async () =>
        expect(await dayDivider()).toHaveAttribute('aria-expanded', 'true')
      );
    });
  });

  describe('states', () => {
    it('should stay busy, with the toolbar and no copy, while the read loads', async () => {
      const read = holdRequest({ method: 'get', url: USER_RATINGS_URL });
      const { container } = await renderPage();
      await read.requested;

      expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
      expect(stat('Items')).toHaveTextContent(/^Items$/);
      expect(screen.queryByText(EMPTY)).toBeNull();
      expect(cells(container)).toHaveLength(0);
    });

    it('should say nothing was rated when the ratings are empty', async () => {
      servePaged({ url: USER_RATINGS_URL, body: [] });
      await renderPage();

      expect(await screen.findByText(EMPTY)).toBeInTheDocument();
      expect(screen.queryByText(EMPTY_FILTERED)).toBeNull();
    });

    it.each([
      { name: 'a type', filters: 'movies/all' },
      { name: 'a rating', filters: 'all/8' },
    ])(
      'should give the filtered copy under $name with no ratings',
      async ({ filters }) => {
        servePaged({ url: USER_RATINGS_URL, body: [] });
        await renderPage({ filters });

        expect(await screen.findByText(EMPTY_FILTERED)).toBeInTheDocument();
        expect(screen.queryByText(EMPTY)).toBeNull();
      },
    );

    it('should give the filtered copy when a hide leaves none of the page', async () => {
      servePaged({
        url: USER_RATINGS_URL,
        body: UserRatingsResponseMock.slice(0, 1),
      });
      await renderPage({ search: '?hide=watched' });

      expect(await screen.findByText(EMPTY_FILTERED)).toBeInTheDocument();
      expect(screen.queryByText(EMPTY)).toBeNull();
    });

    it('should say nothing was rated when a hide meets no ratings', async () => {
      servePaged({ url: USER_RATINGS_URL, body: [] });
      await renderPage({ search: '?hide=watched' });

      expect(await screen.findByText(EMPTY)).toBeInTheDocument();
      expect(screen.queryByText(EMPTY_FILTERED)).toBeNull();
    });

    it('should show the error box and load the cards on Retry', async () => {
      failOnce(USER_RATINGS_URL);
      const { container } = await renderPage();

      await userEvent.click(
        await screen.findByRole('button', { name: 'Retry' }),
      );

      await waitFor(() => expect(cells(container)).toHaveLength(4));
    });
  });

  describe('stats', () => {
    it("should show the read's count", async () => {
      servePaged({
        url: USER_RATINGS_URL,
        body: UserRatingsResponseMock,
        itemCount: 641,
      });
      await renderPage();

      await waitFor(() =>
        expect(stat('Items')).toHaveTextContent(/^641 Items$/)
      );
    });
  });

  describe('reads', () => {
    it('should read a new type and rating when the route changes them', async () => {
      const { container, rerender } = await renderPage();
      await waitFor(() => expect(cells(container)).toHaveLength(4));

      await rerender({ filters: 'movies/all' });

      await waitFor(() => expect(cells(container)).toHaveLength(1));
      expect(screen.getByRole('button', { name: 'Type: Movies' }))
        .toBeInTheDocument();

      await rerender({ filters: 'all/8' });

      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Rating: 8 - Great' }))
          .toBeInTheDocument()
      );
      await waitFor(() => expect(cells(container)).toHaveLength(1));
    });

    it('should carry the path to the request', async () => {
      const requests = await captureRequests(async () => {
        const { container } = await renderPage({ filters: 'seasons/8' });

        await waitFor(() => expect(cells(container)).toHaveLength(1));
      }, { pathIncludes: RATINGS_PATH });

      expect(requests).toContain(`GET ${RATINGS_PATH}/seasons/8`);
    });

    it('should read a new page when the URL changes it', async () => {
      const searches = recordSearches(
        USER_RATINGS_URL,
        UserRatingsResponseMock,
      );
      await renderPage({ follows: true });
      // page.url is shared, so a second instance's write moves the page's read.
      const { replacePage } = await renderStore(() => usePageParam());
      await waitFor(() => expect(searches).toHaveLength(1));

      await replacePage(2);

      await waitFor(() =>
        expect(searches.map((search) => search.get('page')))
          .toEqual(['1', '2'])
      );
    });

    it('should replace a page past the last with the last page', async () => {
      servePaged({
        url: USER_RATINGS_URL,
        body: UserRatingsResponseMock,
        pageCount: 2,
      });
      await renderPage({ search: '?page=5' });

      await waitFor(() => expect(lastReplace()).toBe(`${RATINGS_PATH}?page=2`));
    });
  });

  describe('the phone panel', () => {
    it('should open the rating and sort menus from the gear in the toolbar', async () => {
      const { container } = await renderPage();

      await userEvent.click(gear());

      const panel = assertDefined(controlledBy(gear()));
      expect(panel).toHaveClass('is-open');
      expect(
        within(panel).getAllByRole('button').map((found) =>
          found.getAttribute('aria-label')
        ),
      ).toEqual(['Rating: All Ratings', 'Sort by: Rated Date']);
      expect(container.querySelector('.trakt-subnav-toolbar'))
        .toContainElement(gear());
    });

    it('should close on a rating pick that changes the value, handing the focus to the gear', async () => {
      await renderPage();
      await userEvent.click(gear());
      await openMenuByClick('Rating: All Ratings', 'Rating');

      await pickMenuRadio('8 - Great');

      await waitFor(() => expect(gear()).toHaveFocus());
      expect(controlledBy(gear())).not.toHaveClass('is-open');
    });

    it('should stay open on a pick of the checked rating row', async () => {
      await renderPage();
      await userEvent.click(gear());
      await openMenuByClick('Rating: All Ratings', 'Rating');

      await pickMenuRadio('All Ratings');
      await waitNegativeClaim();

      expect(controlledBy(gear())).toHaveClass('is-open');
    });

    it('should stay open when the eye writes', async () => {
      await renderPage();
      await userEvent.click(gear());
      await openMenuByClick('Filters', 'Filters');

      await pickMenuRadio('Fade watched');

      await waitFor(() =>
        expect(lastReplace()).toBe(`${RATINGS_PATH}?fade=watched`)
      );
      await waitNegativeClaim();

      expect(controlledBy(gear())).toHaveClass('is-open');
    });
  });
});
