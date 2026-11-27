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

  // A page the URL moved to after the call is the user's, so the replace leaves it.
  const replacePage: PageParam['replacePage'] = (page) =>
    set((shown, made) =>
      shown.page === made.page
        ? { page: page === FIRST_PAGE ? null : String(page) }
        : {}
    );

  return {
    page: values.pipe(
      map(({ page }) => page === null ? FIRST_PAGE : Number(page)),
    ),
    replacePage,
    withPageDropped: (write) =>
      Promise.all([write, set({ page: null })]).then(() => undefined),
  };
}
