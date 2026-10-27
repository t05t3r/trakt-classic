import { useInvalidator } from '$lib/features/query/useInvalidator.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import type { MediaListSummary } from '$lib/requests/models/MediaListSummary.ts';
import { LIST_RESPONSE } from '$mocks/data/users/LIST_RESPONSE.ts';
import { LISTS_URL } from '$mocks/data/users/LISTS_URL.ts';
import { PersonalListsMappedMock } from '$mocks/data/users/mapped/PersonalListsMappedMock.ts';
import { PersonalListsResponseMock } from '$mocks/data/users/response/PersonalListsResponseMock.ts';
import { server } from '$mocks/server.ts';
import { useWaitForQueriesIdle } from '$test/beds/query/useWaitForQueriesIdle.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { collectDistinctStates } from '$test/beds/store/collectDistinctStates.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { http, HttpResponse } from 'msw';
import { filter, firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { usePersonalLists } from './usePersonalLists.ts';

const listResponse = (id: number, name: string) => ({
  ...LIST_RESPONSE,
  name,
  ids: { trakt: id, slug: `list-${id}` },
});

const toNames = (lists: ReadonlyArray<MediaListSummary> | undefined) =>
  lists?.map((list) => list.name);

describe('store: usePersonalLists', () => {
  it('should read the personal lists', async () => {
    const lists = await renderStore(() => usePersonalLists());

    expect(await readKnown(lists)).toEqual(PersonalListsMappedMock);
  });

  it('should ask for the lists in rank order, 100 to a page', async () => {
    const searches: URLSearchParams[] = [];
    server.use(
      http.get(LISTS_URL, ({ request }) => {
        searches.push(new URL(request.url).searchParams);
        return pagedResponse({ body: PersonalListsResponseMock });
      }),
    );
    const lists = await renderStore(() => usePersonalLists());

    await readKnown(lists);

    expect(searches.map((search) => [
      search.get('sort_by'),
      search.get('sort_how'),
      search.get('limit'),
    ])).toEqual([['rank', 'asc', '100']]);
  });

  it('should read every page in the order the API returns', async () => {
    serveTwoPages({
      url: LISTS_URL,
      first: [listResponse(6789, 'Watch next')],
      second: () =>
        pagedResponse({
          body: [listResponse(1234, 'Favourites')],
          page: 2,
          pageCount: 2,
        }),
    });
    const lists = await renderStore(() => usePersonalLists());

    expect(toNames(await readKnown(lists))).toEqual([
      'Watch next',
      'Favourites',
    ]);
  });

  describe('loading signal', () => {
    it('should read the lists as not known while the first page loads', async () => {
      holdRequest({
        method: 'get',
        url: LISTS_URL,
        answer: () => pagedResponse({ body: PersonalListsResponseMock }),
      });
      const lists = await renderStore(() => usePersonalLists());

      expect(await firstValueFrom(lists)).toBeUndefined();
    });

    it('should read the lists as not known when the first page fails', async () => {
      const failed = holdRequest({
        method: 'get',
        url: LISTS_URL,
        answer: () => new HttpResponse(null, { status: 500 }),
      });
      failed.release();
      const { lists, waitForQueriesIdle } = await renderStore(() => ({
        lists: usePersonalLists(),
        waitForQueriesIdle: useWaitForQueriesIdle(),
      }));
      // A bound read, so it sees the failure rather than a refetch on subscribe.
      const states = collectDistinctStates(lists);
      await failed.requested;
      await waitForQueriesIdle();

      expect(states).toEqual([undefined]);
    });

    it('should keep the lists it has while a refetch loads a further page', async () => {
      const { lists, invalidate } = await renderStore(() => ({
        lists: usePersonalLists(),
        ...useInvalidator(),
      }));
      const states = collectDistinctStates(lists);
      await readKnown(lists);
      const secondPage = holdResponse(() =>
        pagedResponse({
          body: [listResponse(1234, 'Favourites')],
          page: 2,
          pageCount: 2,
        })
      );
      serveTwoPages({
        url: LISTS_URL,
        first: [listResponse(6789, 'Watch next')],
        second: secondPage.answer,
      });

      const invalidation = invalidate(InvalidateAction.Listed);
      await secondPage.requested;
      const whileFetching = await firstValueFrom(lists);
      secondPage.release();
      await invalidation;
      const refetched = await firstValueFrom(
        lists.pipe(filter((value) => value?.length === 2)),
      );

      expect(toNames(whileFetching)).toEqual(['My personal list']);
      expect(toNames(refetched)).toEqual(['Watch next', 'Favourites']);
      expect(states.map(toNames)).toEqual([
        undefined,
        ['My personal list'],
        ['Watch next', 'Favourites'],
      ]);
    });
  });
});
