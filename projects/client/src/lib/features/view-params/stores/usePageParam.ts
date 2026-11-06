import { isLaterPage } from '$lib/features/view-params/isLaterPage.ts';
import { FIRST_PAGE } from '$lib/utils/FIRST_PAGE.ts';
import { map, type Observable } from 'rxjs';
import { useViewParam } from './useViewParam.ts';

export type PageParam = {
  page: Observable<number>;
  // In place of the current entry, as for a page past the last.
  replacePage(page: number): Promise<void>;
};

type PageParamWrites = PageParam & {
  // Set in the same tick as the write, so both land in one replace.
  withPageDropped(write: Promise<void>): Promise<void>;
};

export function usePageParam(): PageParamWrites {
  const { values, set } = useViewParam({
    page: { values: isLaterPage, fallback: null },
  });

  const replacePage: PageParam['replacePage'] = (page) =>
    set({ page: page === FIRST_PAGE ? null : String(page) });

  return {
    page: values.pipe(
      map(({ page }) => page === null ? FIRST_PAGE : Number(page)),
    ),
    replacePage,
    withPageDropped: (write) =>
      Promise.all([write, replacePage(FIRST_PAGE)]).then(() => undefined),
  };
}
