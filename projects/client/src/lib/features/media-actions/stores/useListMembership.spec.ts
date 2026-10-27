import { useInvalidator } from '$lib/features/query/useInvalidator.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { MATRIX } from '$mocks/data/media-actions/MATRIX.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';
import { SILO_SEASON } from '$mocks/data/media-actions/SILO_SEASON.ts';
import { LIST_RESPONSE } from '$mocks/data/users/LIST_RESPONSE.ts';
import { LISTS_EXACT_URL } from '$mocks/data/users/LISTS_EXACT_URL.ts';
import { PersonalListsMappedMock } from '$mocks/data/users/mapped/PersonalListsMappedMock.ts';
import { server } from '$mocks/server.ts';
import { NEGATIVE_CLAIM_WINDOW } from '$test/beds/promise/NEGATIVE_CLAIM_WINDOW.ts';
import { settleWithin } from '$test/beds/promise/settleWithin.ts';
import { useWaitForQueriesIdle } from '$test/beds/query/useWaitForQueriesIdle.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { movieListItem } from '$test/beds/request/movieListItem.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { collectDistinctStates } from '$test/beds/store/collectDistinctStates.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { screen, within } from '@testing-library/svelte';
import { http, HttpResponse, type JsonBodyType } from 'msw';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it, onTestFinished } from 'vitest';
import {
  type ListMembershipStoreProps,
  useListMembership,
} from './useListMembership.ts';
import { usePersonalLists } from './usePersonalLists.ts';

const LIST = assertDefined(PersonalListsMappedMock.at(0));
const OTHER_LIST = { ...LIST, id: 6789, key: 'list-6789' };
const ITEMS_URL = `http://localhost/users/me/lists/${LIST.id}/items`;
const ITEMS_PATH = `/users/me/lists/${LIST.id}/items/movie,show,season,episode`;

const showItem = (id: number) => ({
  type: 'show',
  show: { ids: { trakt: id } },
});

// A bound surface keeps the snapshot query active, so a write refetches it.
async function renderBound(props: ListMembershipStoreProps) {
  const store = await renderStore(() => useListMembership(props));
  const subscription = store.isListed.subscribe();
  onTestFinished(() => subscription.unsubscribe());
  await readKnown(store.isListed);

  return store;
}

// Two rows in one store share a QueryClient, as two rows on a page do.
async function renderBoundPair() {
  const store = await renderStore(() => ({
    first: useListMembership({ list: LIST, ...SILO }),
    second: useListMembership({ list: OTHER_LIST, ...MATRIX }),
    lists: usePersonalLists(),
    invalidate: useInvalidator().invalidate,
    waitForQueriesIdle: useWaitForQueriesIdle(),
  }));
  const subscriptions = [
    store.first.isListed.subscribe(),
    store.second.isListed.subscribe(),
    store.lists.subscribe(),
  ];
  onTestFinished(() => subscriptions.forEach((sub) => sub.unsubscribe()));
  await Promise.all([
    readKnown(store.first.isListed),
    readKnown(store.second.isListed),
    readKnown(store.lists),
  ]);

  return store;
}

describe('store: useListMembership', () => {
  it('should read a listed movie from the list snapshot', async () => {
    const { isListed } = await renderBound({ list: LIST, ...MATRIX });

    expect(await firstValueFrom(isListed)).toBe(true);
  });

  it('should read a listed season by its own id, not its show', async () => {
    server.use(
      http.get(
        `http://localhost/users/me/lists/${LIST.id}/items*`,
        () =>
          pagedResponse({
            body: [{
              type: 'season',
              season: { number: 1, ids: { trakt: SILO_SEASON.id } },
              show: { title: 'Silo', ids: { trakt: SILO.id } },
            }],
          }),
      ),
    );
    const season = await renderBound({ list: LIST, ...SILO_SEASON });
    const show = await renderBound({ list: LIST, ...SILO });

    expect(await firstValueFrom(show.isListed)).toBe(false);
    expect(await firstValueFrom(season.isListed)).toBe(true);
  });

  it('should read an item from a later page of the list', async () => {
    server.use(
      http.get(`${ITEMS_URL}*`, ({ request }) => {
        const page = new URL(request.url).searchParams.get('page') ?? '1';
        return pagedResponse({
          body: page === '1' ? [movieListItem(MATRIX.id)] : [showItem(SILO.id)],
          page: Number(page),
          pageCount: 2,
        });
      }),
    );
    const { isListed } = await renderBound({ list: LIST, ...SILO });

    expect(await firstValueFrom(isListed)).toBe(true);
  });

  it('should read membership per list', async () => {
    server.use(
      http.get(
        `http://localhost/users/me/lists/${OTHER_LIST.id}/items*`,
        () => pagedResponse({ body: [showItem(SILO.id)] }),
      ),
    );
    const inList = await renderBound({ list: LIST, ...MATRIX });
    const inOtherList = await renderBound({ list: OTHER_LIST, ...MATRIX });
    const otherListSilo = await renderBound({ list: OTHER_LIST, ...SILO });

    expect(await firstValueFrom(inList.isListed)).toBe(true);
    expect(await firstValueFrom(inOtherList.isListed)).toBe(false);
    expect(await firstValueFrom(otherListSilo.isListed)).toBe(true);
  });

  it('should show the addition while the request is in flight, then keep it from the refetch', async () => {
    const items: unknown[] = [movieListItem(MATRIX.id)];
    server.use(http.get(`${ITEMS_URL}*`, () => pagedResponse({ body: items })));
    const { add, isListed, isUpdating } = await renderBound({
      list: LIST,
      ...SILO,
    });
    const inFlight: unknown[] = [];
    server.use(
      http.post(ITEMS_URL, async ({ request }) => {
        inFlight.push(
          await request.json(),
          await firstValueFrom(isListed),
          await firstValueFrom(isUpdating),
        );
        items.push(showItem(SILO.id));
        return new HttpResponse(null, { status: 201 });
      }),
    );

    const requests = await captureRequests(() => add());

    expect(inFlight).toEqual([
      { shows: [{ ids: { trakt: SILO.id } }] },
      true,
      true,
    ]);
    expect(requests).toEqual([
      `POST ${new URL(ITEMS_URL).pathname}`,
      `GET ${ITEMS_PATH}`,
    ]);
    expect(await firstValueFrom(isUpdating)).toBe(false);
    expect(await firstValueFrom(isListed)).toBe(true);
  });

  it('should hold the addition until the refetched list reaches the row', async () => {
    const items: unknown[] = [movieListItem(MATRIX.id)];
    const answerItems = () => pagedResponse({ body: items });
    const refetch = holdResponse(answerItems);
    const posted = { done: false };
    server.use(
      http.get(`${ITEMS_URL}*`, () => {
        if (!posted.done) return answerItems();
        return refetch.answer();
      }),
      http.post(ITEMS_URL, () => {
        items.push(showItem(SILO.id));
        posted.done = true;
        return new HttpResponse(null, { status: 201 });
      }),
    );
    const { add, isListed, isUpdating } = await renderBound({
      list: LIST,
      ...SILO,
    });
    const listedStates = collectDistinctStates(isListed);
    const updatingStates = collectDistinctStates(isUpdating);

    const added = add();
    await refetch.requested;
    expect(await firstValueFrom(isListed)).toBe(true);
    // A held refetch keeps a correct add pending, so the window only bounds the wait.
    expect(await settleWithin(added, NEGATIVE_CLAIM_WINDOW)).toBe('pending');
    refetch.release();
    await added;

    expect(listedStates).toEqual([false, true]);
    expect(updatingStates).toEqual([false, true, false]);
  });

  it('should hold an addition until its own refetch lands when another list is toggled', async () => {
    const items: unknown[] = [movieListItem(MATRIX.id)];
    const answerItems = () => pagedResponse({ body: items });
    const refetch = holdResponse(answerItems);
    const posted = { done: false };
    server.use(
      http.get(`${ITEMS_URL}*`, () => {
        if (!posted.done) return answerItems();
        return refetch.answer();
      }),
      http.post(ITEMS_URL, () => {
        posted.done = true;
        return new HttpResponse(null, { status: 201 });
      }),
    );
    const { first, second } = await renderBoundPair();
    const listedStates = collectDistinctStates(first.isListed);

    const added = first.add();
    await refetch.requested;
    const secondAdded = await second.add();
    const whileRefetching = [
      await settleWithin(added, NEGATIVE_CLAIM_WINDOW),
      await firstValueFrom(first.isUpdating),
      await firstValueFrom(first.isListed),
    ];
    items.push(showItem(SILO.id));
    refetch.release();

    expect([await added, secondAdded]).toEqual([true, true]);
    expect(whileRefetching).toEqual(['pending', true, true]);
    expect(listedStates).toEqual([false, true]);
  });

  it("should refetch its own list's items and the personal lists, not another list's items", async () => {
    const { first } = await renderBoundPair();

    const requests = await captureRequests(() => first.add());

    expect(requests.at(0)).toBe(`POST ${new URL(ITEMS_URL).pathname}`);
    expect(requests.toSorted()).toEqual([
      'GET /users/me/lists',
      `GET ${ITEMS_PATH}`,
      `POST ${new URL(ITEMS_URL).pathname}`,
    ]);
  });

  it('should end with the written lists when a lists refetch is in flight', async () => {
    const posted = { done: false };
    const refetch = holdResponse((body: JsonBodyType) =>
      pagedResponse({ body })
    );
    const { first, lists, invalidate, waitForQueriesIdle } =
      await renderBoundPair();
    server.use(
      http.get(LISTS_EXACT_URL, () => {
        const body = [{ ...LIST_RESPONSE, item_count: posted.done ? 2 : 1 }];
        if (posted.done) return pagedResponse({ body });
        return refetch.answer(body);
      }),
      http.post(ITEMS_URL, () => {
        posted.done = true;
        return new HttpResponse(null, { status: 201 });
      }),
    );

    const refetching = invalidate(InvalidateAction.Listed);
    await refetch.requested;
    await first.add();
    refetch.release();
    await refetching;
    await waitForQueriesIdle();

    expect((await firstValueFrom(lists))?.map((list) => list.count))
      .toEqual([2]);
  });

  it('should show the removal while the request is in flight', async () => {
    const { remove, isListed } = await renderBound({ list: LIST, ...MATRIX });
    const inFlight: unknown[] = [];
    server.use(
      http.post(`${ITEMS_URL}/remove`, async ({ request }) => {
        inFlight.push(await request.json(), await firstValueFrom(isListed));
        return new HttpResponse(null, { status: 200 });
      }),
    );

    const requests = await captureRequests(() => remove());

    expect(inFlight).toEqual([
      { movies: [{ ids: { trakt: MATRIX.id } }] },
      false,
    ]);
    expect(requests).toEqual([
      `POST ${new URL(ITEMS_URL).pathname}/remove`,
      `GET ${ITEMS_PATH}`,
    ]);
  });

  it('should add a season with a season body', async () => {
    const { add } = await renderBound({ list: LIST, ...SILO_SEASON });
    const bodies: unknown[] = [];
    server.use(
      http.post(ITEMS_URL, async ({ request }) => {
        bodies.push(await request.json());
        return new HttpResponse(null, { status: 201 });
      }),
    );

    await add();

    expect(bodies).toEqual([{ seasons: [{ ids: { trakt: SILO_SEASON.id } }] }]);
  });

  it('should roll back and show the error toast when the request fails', async () => {
    server.use(
      http.post(
        `${ITEMS_URL}/remove`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    const { remove, isListed, isUpdating } = await renderBound({
      list: LIST,
      ...MATRIX,
    });

    await remove();

    expect(await firstValueFrom(isListed)).toBe(true);
    expect(await firstValueFrom(isUpdating)).toBe(false);
    expect(
      within(screen.getByRole('status')).getByText(
        "Couldn't save. Try again.",
      ),
    ).toBeVisible();
  });

  describe('loading signal', () => {
    it('should read a Target as not known while the list loads', async () => {
      holdRequest({
        method: 'get',
        url: `${ITEMS_URL}*`,
        answer: () => pagedResponse({ body: [] }),
      });
      const { isListed } = await renderStore(() =>
        useListMembership({ list: LIST, ...MATRIX })
      );

      expect(await firstValueFrom(isListed)).toBeUndefined();
    });

    it('should keep the snapshot while an add grows the list past one page', async () => {
      const { matrix, silo } = await renderStore(() => ({
        matrix: useListMembership({ list: LIST, ...MATRIX }),
        silo: useListMembership({ list: LIST, ...SILO }),
      }));
      const bound = matrix.isListed.subscribe();
      onTestFinished(() => bound.unsubscribe());
      await readKnown(matrix.isListed);
      const states = collectDistinctStates(matrix.isListed);
      const secondPage = holdResponse(() =>
        pagedResponse({ body: [], page: 2, pageCount: 2 })
      );
      serveTwoPages({
        url: `${ITEMS_URL}*`,
        first: [movieListItem(MATRIX.id)],
        second: secondPage.answer,
      });

      const adding = silo.add();
      await secondPage.requested;
      const whileFetching = await firstValueFrom(matrix.isListed);
      secondPage.release();
      await adding;

      expect(whileFetching).toBe(true);
      expect(states).toEqual([true]);
    });

    it('should settle on the pages it has when a further page fails', async () => {
      serveTwoPages({
        url: `${ITEMS_URL}*`,
        first: [movieListItem(MATRIX.id)],
        second: () => new HttpResponse(null, { status: 500 }),
      });
      const { matrix, silo } = await renderStore(() => ({
        matrix: useListMembership({ list: LIST, ...MATRIX }),
        silo: useListMembership({ list: LIST, ...SILO }),
      }));

      const settled = await readKnown(matrix.isListed);

      expect(settled).toBe(true);
      expect(await firstValueFrom(silo.isListed)).toBe(false);
    });
  });
});
