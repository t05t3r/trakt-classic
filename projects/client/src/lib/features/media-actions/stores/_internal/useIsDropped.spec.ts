import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { pendingOverrides } from '$lib/features/media-actions/_internal/pendingOverrides.ts';
import { toTargetKey } from '$lib/features/media-actions/_internal/toTargetKey.ts';
import { DEVS } from '$mocks/data/media-actions/DEVS.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { filter, firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { useIsDropped } from './useIsDropped.ts';

const DEVS_OVERRIDE = {
  action: 'drop',
  targetKey: toTargetKey('show', DEVS.id),
  requestId: 'request',
} as const;

async function renderIsDropped(id: number) {
  const store = await renderStore(() => ({
    ...useIsDropped({ id }),
    dropped: useUser().dropped,
  }));

  await firstValueFrom(store.dropped.pipe(filter(Boolean)));
  return store;
}

describe('store: useIsDropped', () => {
  afterEach(() => pendingOverrides.clear(DEVS_OVERRIDE));

  describe('dropped snapshot', () => {
    it.each([
      { id: DEVS.id, expected: true },
      { id: SILO.id, expected: false },
    ])(
      'should read show $id as dropped: $expected',
      async ({ id, expected }) => {
        const { isDropped, isUpdating } = await renderIsDropped(id);

        expect(await firstValueFrom(isDropped)).toBe(expected);
        expect(await firstValueFrom(isUpdating)).toBe(false);
      },
    );
  });

  describe('pending override', () => {
    it('should read the override before the snapshot, as updating', async () => {
      pendingOverrides.set({ ...DEVS_OVERRIDE, value: false });

      const { isDropped, isUpdating } = await renderIsDropped(DEVS.id);

      expect(await firstValueFrom(isDropped)).toBe(false);
      expect(await firstValueFrom(isUpdating)).toBe(true);
    });
  });
});
