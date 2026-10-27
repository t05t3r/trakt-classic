import { useViewParam } from '$lib/features/view-params/stores/useViewParam.ts';
import { distinctUntilChanged, map, type Observable } from 'rxjs';
import type { CastGroupKey } from '../_internal/CastGroup.ts';

const GUEST = 'guest';

// Only Guest Stars reaches the URL, so a page's first pane never does.
const SPEC = {
  actors: { values: [GUEST], fallback: null },
};

export function useCastTab(): {
  tab: Observable<'guest' | null>;
  select(key: CastGroupKey): Promise<void>;
} {
  const { values, set } = useViewParam(SPEC);

  return {
    tab: values.pipe(
      map(({ actors }) => actors === GUEST ? GUEST : null),
      distinctUntilChanged(),
    ),
    select: (key) => set({ actors: key === GUEST ? GUEST : null }),
  };
}
