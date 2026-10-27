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
  it('should clear every pending override', async () => {
    const watched = { action: 'watched', targetKey: 'movie:1' } as const;
    pendingOverrides.set({ ...watched, value: true, requestId: 'a' });
    pendingOverrides.set({ ...LEAKED_KEY, value: false, requestId: 'b' });

    resetPendingOverrides();

    expect([
      await lookupPendingOverride(watched),
      await lookupPendingOverride(LEAKED_KEY),
    ])
      .toEqual([undefined, undefined]);
  });
});
