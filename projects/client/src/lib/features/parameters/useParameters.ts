import { combineLatest, distinctUntilChanged, map } from 'rxjs';
import { createParameterContext } from './_internal/createParameterContext.ts';
import type { ParameterType } from './_internal/ParameterType.ts';

export function useParameters() {
  const { parameters, url, override, isEscaped } = createParameterContext();

  const update = (params: Record<string, ParameterType>) => {
    const next = new Map(
      Array.from(parameters.value.entries()).filter(([key]) => key in params),
    );
    Object.entries(params).forEach(([key, value]) => next.set(key, value));
    parameters.next(next);
  };

  const search = combineLatest([parameters, override]).pipe(
    map(([current, currentOverride]) => {
      const result = new URLSearchParams();
      current.forEach((value, key) => {
        if (key !== currentOverride) result.set(key, String(value));
      });
      return result;
    }),
    distinctUntilChanged((a, b) => a.toString() === b.toString()),
  );

  return {
    search,
    update,
    override,
    isEscaped,
    url: url.asObservable(),
    setUrl: (next: URL) => url.next(next),
  };
}
