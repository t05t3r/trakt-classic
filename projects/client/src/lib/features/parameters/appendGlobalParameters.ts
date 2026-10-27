import {
  filterScopeStore,
  type FilterScopeValue,
} from '$lib/features/filters/filterScopeStore.ts';
import { FILTER_KEYS } from '$lib/features/filters/filterKeys.ts';
import { buildParamString } from '$lib/utils/url/buildParamString.ts';
import { combineLatest } from 'rxjs';
import { LOCAL_PARAMS } from './_internal/LOCAL_PARAMS.ts';
import { WHITE_LISTED_PARAMS } from './_internal/WHITE_LISTED_PARAMS.ts';
import { useParameters } from './useParameters.ts';

type ParameterSnapshot = [
  URLSearchParams,
  string,
  boolean,
  FilterScopeValue,
  URL,
];

function buildEffectiveSearch({
  search,
  filterScope,
  overrideKey,
}: {
  search: URLSearchParams;
  filterScope: FilterScopeValue;
  overrideKey: string;
}): URLSearchParams {
  if (!filterScope) return search;

  const result = new URLSearchParams(search);
  FILTER_KEYS.forEach((key) => result.delete(key));
  Object.entries(filterScope).forEach(([key, value]) => {
    if (key !== overrideKey) result.set(key, value);
  });
  return result;
}

export function appendGlobalParameters(
  anchor: HTMLAnchorElement,
  href?: string | Nil,
) {
  const { search, override, isEscaped, url } = useParameters();
  let originalHref = href ?? anchor.getAttribute('href') ?? '';
  let latestValues: ParameterSnapshot | null = null;

  const applyParameters = () => {
    if (!latestValues) return;
    const [$search, $override, $isEscaped, $filterScope, $url] = latestValues;
    if ($isEscaped) return;

    const target = new URL(originalHref, $url.href);
    if ($url.origin !== target.origin) return;

    const localEntries = target.pathname === $url.pathname && $override
      ? Array.from($url.searchParams.entries()).filter(([key]) =>
        LOCAL_PARAMS.includes(key)
      )
      : [];
    const effectiveSearch = target.pathname === $url.pathname
      ? $search
      : buildEffectiveSearch({
        search: $search,
        filterScope: $filterScope,
        overrideKey: $override,
      });
    const params = Object.fromEntries([
      ...localEntries,
      ...Array.from(target.searchParams.entries()).filter(([key]) =>
        key === $override || !WHITE_LISTED_PARAMS.includes(key)
      ),
      ...effectiveSearch.entries(),
    ]);
    anchor.href = `${target.pathname}${buildParamString(params)}`;
  };

  const subscription = combineLatest(
    [search, override, isEscaped, filterScopeStore, url],
  ).subscribe({
    next: (values: ParameterSnapshot) => {
      latestValues = values;
      applyParameters();
    },
    error: console.error,
  });

  return {
    update: (nextHref?: string | Nil) => {
      originalHref = nextHref ?? originalHref;
      applyParameters();
    },
    destroy: () => subscription.unsubscribe(),
  };
}
