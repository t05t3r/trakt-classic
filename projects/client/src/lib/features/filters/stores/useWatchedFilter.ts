import { useViewParam } from '$lib/features/view-params/stores/useViewParam.ts';
import { distinctUntilChanged, map, type Observable } from 'rxjs';

export type WatchedFilter = 'fade' | 'hide';

type HideParam = Readonly<{ param: string; value: string }>;

const WATCHED = 'watched';
const HIDE_WATCHED: HideParam = { param: 'hide', value: WATCHED };

export function useWatchedFilter(hide: HideParam = HIDE_WATCHED): {
  filter: Observable<WatchedFilter | null>;
  set(filter: WatchedFilter | null): Promise<void>;
} {
  const { values, set } = useViewParam({
    fade: { values: [WATCHED], fallback: null },
    [hide.param]: { values: [hide.value], fallback: null },
  });

  return {
    // Hiding wins over fading in a URL that asks for both.
    filter: values.pipe(
      map((params) => {
        if (params[hide.param] === hide.value) return 'hide';
        if (params.fade === WATCHED) return 'fade';
        return null;
      }),
      distinctUntilChanged(),
    ),
    set: (filter) =>
      set({
        fade: filter === 'fade' ? WATCHED : null,
        [hide.param]: filter === 'hide' ? hide.value : null,
      }),
  };
}
