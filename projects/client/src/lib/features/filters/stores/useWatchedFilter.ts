import { useViewParam } from '$lib/features/view-params/stores/useViewParam.ts';
import { distinctUntilChanged, map, type Observable } from 'rxjs';

export type WatchedFilter = 'fade' | 'hide';

const WATCHED = 'watched';
const SPEC = {
  fade: { values: [WATCHED], fallback: null },
  hide: { values: [WATCHED], fallback: null },
};

export function useWatchedFilter(): {
  filter: Observable<WatchedFilter | null>;
  set(filter: WatchedFilter | null): Promise<void>;
} {
  const { values, set } = useViewParam(SPEC);

  return {
    // Hiding wins over fading in a URL that asks for both.
    filter: values.pipe(
      map(({ fade, hide }) => {
        if (hide === WATCHED) return 'hide';
        if (fade === WATCHED) return 'fade';
        return null;
      }),
      distinctUntilChanged(),
    ),
    set: (filter) =>
      set({
        fade: filter === 'fade' ? WATCHED : null,
        hide: filter === 'hide' ? WATCHED : null,
      }),
  };
}
