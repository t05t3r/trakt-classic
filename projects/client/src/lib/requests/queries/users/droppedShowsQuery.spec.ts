import { useSnapshot } from '$lib/features/query/useSnapshot.ts';
import { MAX_PAGE_LIMIT } from '$lib/requests/MAX_PAGE_LIMIT.ts';
import { DroppedShowsResponseMock } from '$mocks/data/users/response/DroppedShowsResponseMock.ts';
import { DROPPED_URL } from '$mocks/data/users/DROPPED_URL.ts';
import { server } from '$mocks/server.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, onTestFinished } from 'vitest';
import { droppedShowsQuery } from './droppedShowsQuery.ts';

const LAST_PAGE_WITH_ENTRIES = 2;
// A 4xx fails the next page without a retry, so a page loop ends instead of hanging.
const MAX_REQUESTS = LAST_PAGE_WITH_ENTRIES + 2;

describe('droppedShowsQuery', () => {
  it('should stop fetching at the first empty page when pagination headers are missing', async () => {
    const requestedPages: string[] = [];
    server.use(
      http.get(DROPPED_URL, ({ request }) => {
        const page = new URL(request.url).searchParams.get('page') ?? '1';
        requestedPages.push(page);

        if (requestedPages.length >= MAX_REQUESTS) {
          return notFound();
        }

        return HttpResponse.json(
          Number(page) <= LAST_PAGE_WITH_ENTRIES
            ? DroppedShowsResponseMock
            : [],
        );
      }),
    );
    const snapshot = await renderStore(() =>
      useSnapshot(droppedShowsQuery({ limit: MAX_PAGE_LIMIT }), {
        select: (entries) => entries,
        whileUnsettled: 'hold',
      })
    );
    const subscription = snapshot.subscribe();
    onTestFinished(() => subscription.unsubscribe());

    await readKnown(snapshot);

    expect(requestedPages).toEqual(['1', '2', '3']);
  });
});
