import { multicast } from '$lib/utils/store/multicast.ts';
import {
  distinctUntilChanged,
  filter,
  ignoreElements,
  map,
  merge,
  type Observable,
  shareReplay,
  tap,
} from 'rxjs';

type PagedReadingLike = Readonly<{
  pages: Readonly<{ total: number | undefined }>;
}>;

type WithPageClampParams<R> = {
  reading: Observable<R>;
  page: number;
  replacePage: (page: number) => void;
};

export function withPageClamp<R extends PagedReadingLike>(
  { reading, page, replacePage }: WithPageClampParams<R>,
): Observable<R> {
  const shared = reading.pipe(multicast());
  const clampPage = shared.pipe(
    map(({ pages }) => pages.total),
    distinctUntilChanged(),
    filter((total): total is number => total !== undefined && page > total),
    tap((total) => replacePage(total)),
    ignoreElements(),
  );

  // The clamp leaves with the last reader, so a replaced view's late count rewrites no URL.
  return merge(shared, clampPage).pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
