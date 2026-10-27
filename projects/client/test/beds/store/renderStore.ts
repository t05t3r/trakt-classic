import { render } from '@testing-library/svelte';
import type { Session } from '$lib/features/auth/models/Session.ts';
import StoreTestBed from '$test/beds/store/StoreTestBed.svelte';

export function renderStore<T>(
  factory: () => T,
  session?: Session | null,
): Promise<T> {
  return new Promise((resolve) =>
    render(StoreTestBed, {
      props: {
        factory,
        session,
        output: (value: unknown) => resolve(value as T),
      },
    })
  );
}
