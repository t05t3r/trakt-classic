import { emulateHydrated } from '$test/beds/hydration/emulateHydrated.ts';
import { collectDistinctStates } from '$test/beds/store/collectDistinctStates.ts';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { isHydrated, useHydrated } from './hydration.ts';

describe('util: hydration', () => {
  it('should read as not hydrated until the app is', async () => {
    expect(isHydrated()).toBe(false);
    expect(await firstValueFrom(useHydrated())).toBe(false);
  });

  it('should tell a reader that subscribed before hydration once the app hydrates', () => {
    const seen = collectDistinctStates(useHydrated());

    emulateHydrated();

    expect(seen).toEqual([false, true]);
  });

  it('should read as hydrated for a reader that subscribes after hydration', async () => {
    emulateHydrated();

    expect(isHydrated()).toBe(true);
    expect(await firstValueFrom(useHydrated())).toBe(true);
  });
});
