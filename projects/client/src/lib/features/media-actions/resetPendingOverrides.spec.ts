import { lookupPendingOverride } from '$test/beds/media-actions/lookupPendingOverride.ts';
import { describe, expect, it } from 'vitest';
import {
  type PendingOverrideKey,
  pendingOverrides,
} from './_internal/pendingOverrides.ts';
import { resetPendingOverrides } from './resetPendingOverrides.ts';

const LEAKED_KEY: PendingOverrideKey = {
  action: 'list',
  targetKey: 'show:180770',
  listId: 1,
};

describe('resetPendingOverrides', () => {
  it('should clear every pending override, in flight or kept', async () => {
    const watched = { action: 'watched', targetKey: 'movie:1' } as const;
    const hide = { action: 'hide', targetKey: 'movie:2' } as const;
    pendingOverrides.set({ ...watched, value: true, requestId: 'a' });
    pendingOverrides.set({ ...LEAKED_KEY, value: false, requestId: 'b' });
    pendingOverrides.set({ ...hide, value: true, requestId: 'c' });
    pendingOverrides.keep({ ...hide, requestId: 'c' });

    resetPendingOverrides();

    expect([
      await lookupPendingOverride(watched),
      await lookupPendingOverride(LEAKED_KEY),
      await lookupPendingOverride(hide),
    ])
      .toEqual([undefined, undefined, undefined]);
  });
});
