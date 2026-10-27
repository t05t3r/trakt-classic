import { userListItemIdsQuery } from '$lib/requests/queries/users/userListItemIdsQuery.ts';
import { ITEMS_URL } from '$mocks/data/users/ITEMS_URL.ts';
import { LIST_ID } from '$mocks/data/users/LIST_ID.ts';
import { server } from '$mocks/server.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { movieListItem } from '$test/beds/request/movieListItem.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { http } from 'msw';
import { filter, firstValueFrom } from 'rxjs';
import { describe, expect, it, onTestFinished } from 'vitest';
import { useAllPagesInfiniteQuery } from './useAllPagesInfiniteQuery.ts';

// A last page ends a refetch loop, so the idle wait ends and the spec fails.
const MAX_FAILED_ANSWERS = 5;
const ITEM = movieListItem(481);

describe('useAllPagesInfiniteQuery', () => {
  it('should not request a failed next page again on its own', async () => {
    const pageTwoRequests: string[] = [];
    server.use(
      http.get(ITEMS_URL, ({ request }) => {
        const page = new URL(request.url).searchParams.get('page');
        if (page === '2') {
          pageTwoRequests.push(request.url);
          if (pageTwoRequests.length > MAX_FAILED_ANSWERS) {
            return pagedResponse({ body: [ITEM], page: 2, pageCount: 2 });
          }
          return notFound();
        }

        return pagedResponse({ body: [ITEM], pageCount: 2 });
      }),
    );
    const { query, waitForLateRequests } = await renderStore(() => ({
      query: useAllPagesInfiniteQuery(
        userListItemIdsQuery({ userId: 'me', listId: LIST_ID }),
      ),
      waitForLateRequests: useWaitForLateRequests(),
    }));
    const subscription = query.subscribe();
    onTestFinished(() => subscription.unsubscribe());

    await firstValueFrom(query.pipe(filter((q) => q.isFetchNextPageError)));
    await waitForLateRequests();

    expect(pageTwoRequests).toHaveLength(1);
  });
});
