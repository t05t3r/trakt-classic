import { api, type ApiParams } from '$lib/requests/api.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import {
  type PageMeta,
  PaginatableSchemaFactory,
} from '$lib/requests/models/Paginatable.ts';
import { setMarker } from '$lib/utils/date/marker.ts';
import { ITEMS_URL } from '$mocks/data/users/ITEMS_URL.ts';
import { LIST_ID } from '$mocks/data/users/LIST_ID.ts';
import { server } from '$mocks/server.ts';
import { movieListItem } from '$test/beds/request/movieListItem.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { http, HttpResponse } from 'msw';
import { filter, firstValueFrom } from 'rxjs';
import { describe, expect, it, onTestFinished } from 'vitest';
import { z } from 'zod';
import { defineInfiniteQuery, defineQuery } from './defineQuery.ts';
import { useAllPagesInfiniteQuery } from './_internal/useAllPagesInfiniteQuery.ts';

type PagedResult = {
  data?: unknown;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isFetchNextPageError: boolean;
};

const hasStoppedPaging = (query: PagedResult) =>
  query.isFetchNextPageError ||
  (query.data !== undefined && !query.isFetchingNextPage && !query.hasNextPage);

const ITEM = movieListItem(481);
const LAST_PAGE = 3;
// A 4xx fails the next page without a retry, so a page loop ends, not hangs.
const MAX_REQUESTS = LAST_PAGE + 2;

type SpecItemsQueryParams = {
  key: string;
  pageMeta: PageMeta;
};

const defineSpecItemsQuery = ({ key, pageMeta }: SpecItemsQueryParams) =>
  defineInfiniteQuery({
    key,
    invalidations: [],
    dependencies: [],
    request: ({ fetch, page = 1 }: ApiParams & { page?: number }) =>
      api({ fetch })
        .users
        .lists
        .list
        .items
        .all({
          params: { id: 'me', list_id: String(LIST_ID) },
          query: { page, limit: 1 },
        }),
    mapper: (response) => ({
      entries: response.body,
      page: pageMeta,
    }),
    schema: PaginatableSchemaFactory(z.unknown()),
    ttl: null,
  });

const specInfiniteItemsQuery = defineSpecItemsQuery({
  key: 'defineInfiniteQuerySpecItems',
  pageMeta: { type: 'infinite', current: 1 },
});

const specPaginatedItemsQuery = defineSpecItemsQuery({
  key: 'defineInfiniteQuerySpecPaginatedItems',
  pageMeta: { type: 'paginated', current: 1, total: LAST_PAGE },
});

function serveItems(respond: (page: number) => unknown[]) {
  const requestedPages: number[] = [];
  server.use(
    http.get(ITEMS_URL, ({ request }) => {
      const page = Number(new URL(request.url).searchParams.get('page'));
      requestedPages.push(page);

      if (requestedPages.length >= MAX_REQUESTS) {
        return notFound();
      }

      return HttpResponse.json(respond(page));
    }),
  );

  return requestedPages;
}

async function fetchAllPages(
  options: ReturnType<ReturnType<typeof defineSpecItemsQuery>>,
) {
  const query = await renderStore(() => useAllPagesInfiniteQuery(options));
  const subscription = query.subscribe();
  onTestFinished(() => subscription.unsubscribe());

  await firstValueFrom(
    query.pipe(filter(hasStoppedPaging)),
  );
}

describe('defineInfiniteQuery', () => {
  it('should request each page once in order until an empty page when the page meta has no total', async () => {
    const requestedPages = serveItems((page) => page < LAST_PAGE ? [ITEM] : []);

    await fetchAllPages(specInfiniteItemsQuery());

    expect(requestedPages).toEqual([1, 2, 3]);
  });

  it('should stop at the page total when every page reads as the first', async () => {
    const requestedPages = serveItems(() => [ITEM]);

    await fetchAllPages(specPaginatedItemsQuery());

    expect(requestedPages).toEqual([1, 2, 3]);
  });
});

type SpecListParams = ApiParams & { listId: string; page?: number };

const specListRequest = async (
  { fetch = globalThis.fetch }: SpecListParams,
) => {
  await fetch('http://localhost/define-query-spec');
  return { status: 200, body: [] };
};

const specListInvalidations = (
  { listId }: SpecListParams,
) => [InvalidateAction.ListedIn(listId)];

const specListQuery = defineQuery({
  key: 'defineQuerySpecList',
  invalidations: specListInvalidations,
  dependencies: (params) => [params.listId],
  request: specListRequest,
  mapper: (response) => response.body,
  schema: z.array(z.unknown()),
  ttl: null,
});

const specListPagesQuery = defineInfiniteQuery({
  key: 'defineQuerySpecListPages',
  invalidations: specListInvalidations,
  dependencies: (params) => [params.listId, params.page],
  request: specListRequest,
  mapper: (response) => ({
    entries: response.body,
    page: { type: 'paginated' as const, current: 1, total: 1 },
  }),
  schema: PaginatableSchemaFactory(z.unknown()),
  ttl: null,
});

describe('invalidations given by params', () => {
  it('should key a query by the invalidations its params give', () => {
    const keys = [specListQuery, specListPagesQuery].map((query) =>
      query({ listId: 'own' }).queryKey
    );

    keys.forEach((key) => {
      expect(key).toContain(InvalidateAction.ListedIn('own'));
      expect(key).not.toContain(InvalidateAction.ListedIn('other'));
    });
  });

  it('should mark a request with the markers its params give', async () => {
    const urls: string[] = [];
    const fetch = (input: RequestInfo | URL) => {
      urls.push(`${input}`);
      return Promise.resolve(new Response());
    };
    const query = specListQuery({ listId: 'marker-own', fetch });

    await query.execute();
    setMarker(InvalidateAction.ListedIn('marker-other'));
    await query.execute();
    setMarker(InvalidateAction.ListedIn('marker-own'));
    await query.execute();

    expect(urls.at(1)).toBe(urls.at(0));
    expect(urls.at(2)).not.toBe(urls.at(0));
  });
});
