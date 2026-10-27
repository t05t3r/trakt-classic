import { describe, expect, it } from 'vitest';
import {
  type Held,
  nextHeld,
  type PagedQuery,
  type WhileUnsettled,
} from './nextHeld.ts';

const page = (entries: number[], current: number) => ({
  entries,
  page: { type: 'paginated', current, total: 2 } as const,
});

const IDLE = {
  isPending: false,
  isFetching: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  isError: false,
  isFetchNextPageError: false,
};
const LOADING: PagedQuery<number> = {
  ...IDLE,
  isPending: true,
  isFetching: true,
};
const ONE_PAGE = { pages: [page([1, 2], 1)], pageParams: [1] };
const TWO_PAGES = {
  pages: [page([1, 2], 1), page([3], 2)],
  pageParams: [1, 2],
};
const SETTLED: PagedQuery<number> = { ...IDLE, data: ONE_PAGE };
const NEXT_PAGE_DUE: PagedQuery<number> = {
  ...IDLE,
  data: ONE_PAGE,
  hasNextPage: true,
};
const FETCHING_NEXT_PAGE: PagedQuery<number> = {
  ...NEXT_PAGE_DUE,
  isFetching: true,
  isFetchingNextPage: true,
};
const NEXT_PAGE_FAILED: PagedQuery<number> = {
  ...NEXT_PAGE_DUE,
  isError: true,
  isFetchNextPageError: true,
};
const REFETCHING: PagedQuery<number> = { ...SETTLED, isFetching: true };
const REFETCH_FAILED: PagedQuery<number> = { ...SETTLED, isError: true };
const ALL_PAGES: PagedQuery<number> = { ...IDLE, data: TWO_PAGES };

type Read = { query: PagedQuery<number>; count: number };

function readAll(
  reads: ReadonlyArray<Read>,
  whileUnsettled: WhileUnsettled = 'hold',
): ReadonlyArray<Held<number>> {
  return reads.reduce<ReadonlyArray<Held<number>>>(
    (helds, { query, count }) => [
      ...helds,
      nextHeld({ held: helds.at(-1), query, count, whileUnsettled }),
    ],
    [],
  );
}

const pagesOf = (helds: ReadonlyArray<Held<number>>) =>
  helds.map((held) => held.pages);

describe('nextHeld', () => {
  it('should read a query with no data as not known', () => {
    expect(pagesOf(readAll([{ query: LOADING, count: 0 }]))).toEqual([
      undefined,
    ]);
  });

  it('should read a settled query as its entries over every page', () => {
    expect(
      pagesOf(readAll([
        { query: LOADING, count: 0 },
        { query: ALL_PAGES, count: 2 },
      ])),
    ).toEqual([undefined, [1, 2, 3]]);
  });

  it('should keep the settled entries while a further page is due or fetching', () => {
    const helds = readAll([
      { query: SETTLED, count: 1 },
      { query: NEXT_PAGE_DUE, count: 2 },
      { query: FETCHING_NEXT_PAGE, count: 2 },
      { query: ALL_PAGES, count: 3 },
    ]);

    expect(helds.at(1)).toBe(helds.at(0));
    expect(helds.at(2)).toBe(helds.at(0));
    expect(pagesOf(helds)).toEqual([[1, 2], [1, 2], [1, 2], [1, 2, 3]]);
  });

  it('should stay not known while the first pages arrive', () => {
    expect(
      pagesOf(readAll([
        { query: LOADING, count: 0 },
        { query: NEXT_PAGE_DUE, count: 1 },
        { query: FETCHING_NEXT_PAGE, count: 1 },
      ])),
    ).toEqual([undefined, undefined, undefined]);
  });

  it('should return the same Held when only the fetch state changes', () => {
    const helds = readAll([
      { query: SETTLED, count: 1 },
      { query: REFETCHING, count: 1 },
      { query: SETTLED, count: 1 },
    ]);

    expect(helds.at(1)).toBe(helds.at(0));
    expect(helds.at(2)).toBe(helds.at(0));
  });

  it('should drop the settled entries when the data goes away', () => {
    expect(
      pagesOf(readAll([
        { query: SETTLED, count: 1 },
        { query: LOADING, count: 1 },
      ])),
    ).toEqual([[1, 2], undefined]);
  });

  describe('when a further page fails', () => {
    it('should settle on the pages it has', () => {
      expect(
        pagesOf(readAll([
          { query: LOADING, count: 0 },
          { query: NEXT_PAGE_FAILED, count: 1 },
        ])),
      ).toEqual([undefined, [1, 2]]);
    });

    it('should read as not known when asked for unknown while unsettled', () => {
      expect(
        pagesOf(readAll([
          { query: SETTLED, count: 1 },
          { query: NEXT_PAGE_FAILED, count: 1 },
        ], 'unknown')),
      ).toEqual([[1, 2], undefined]);
    });
  });

  describe('when a refetch of a loaded page fails', () => {
    it('should return the same Held', () => {
      const helds = readAll([
        { query: SETTLED, count: 1 },
        { query: REFETCH_FAILED, count: 1 },
      ]);

      expect(helds.at(1)).toBe(helds.at(0));
    });

    it('should read as not known when asked for unknown while unsettled', () => {
      expect(
        pagesOf(readAll([
          { query: SETTLED, count: 1 },
          { query: REFETCH_FAILED, count: 1 },
        ], 'unknown')),
      ).toEqual([[1, 2], undefined]);
    });
  });

  describe('when asked for unknown while unsettled', () => {
    it('should read as not known while a loaded page refetches', () => {
      expect(
        pagesOf(readAll([
          { query: SETTLED, count: 1 },
          { query: REFETCHING, count: 1 },
          { query: SETTLED, count: 1 },
        ], 'unknown')),
      ).toEqual([[1, 2], undefined, [1, 2]]);
    });

    it('should read as not known while a further page is due or fetching', () => {
      expect(
        pagesOf(readAll([
          { query: SETTLED, count: 1 },
          { query: NEXT_PAGE_DUE, count: 2 },
          { query: FETCHING_NEXT_PAGE, count: 2 },
          { query: ALL_PAGES, count: 3 },
        ], 'unknown')),
      ).toEqual([[1, 2], undefined, undefined, [1, 2, 3]]);
    });

    it('should reuse the entries of a known read of the same data', () => {
      const known = nextHeld({
        query: SETTLED,
        count: 1,
        whileUnsettled: 'unknown',
      });

      const again = nextHeld({
        held: known,
        query: SETTLED,
        count: 1,
        whileUnsettled: 'unknown',
      });

      expect(again.pages).toBe(known.pages);
    });
  });

  describe('when the same data settles at a newer data update', () => {
    it('should keep the entries and take the newer count', () => {
      const held = nextHeld({
        query: SETTLED,
        count: 1,
        whileUnsettled: 'hold',
      });

      const next = nextHeld({
        held,
        query: SETTLED,
        count: 2,
        whileUnsettled: 'hold',
      });

      expect(next.pages).toBe(held.pages);
      expect(next.count).toBe(2);
    });
  });
});
