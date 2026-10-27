import { render } from '@testing-library/svelte';
import type { Observable } from 'rxjs';
import QueryTestBed from '$test/beds/query/QueryTestBed.svelte';

type RunQueryProps<T> = {
  factory: () => Observable<T>;
  mapper?: (response: T) => unknown;
  waitFor?: (response: T) => boolean;
};

export function runQuery<T>({
  factory,
  mapper,
  waitFor,
}: RunQueryProps<T>): Promise<T> {
  return new Promise((resolve) =>
    render(QueryTestBed, {
      props: {
        factory,
        mapper: mapper as ((response: unknown) => unknown) | undefined,
        waitFor: waitFor as ((response: unknown) => boolean) | undefined,
        output: (value: unknown) => resolve(value as T),
      },
    })
  );
}
