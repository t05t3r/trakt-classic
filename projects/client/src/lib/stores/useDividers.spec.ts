import { safeLocalStorage } from '$lib/utils/storage/safeLocalStorage.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { describe, expect, it } from 'vitest';
import { useDividers } from './useDividers.ts';

describe('store: useDividers', () => {
  it('should show the dividers when nothing is stored', async () => {
    expect(await readKnown(useDividers().shown)).toBe(true);
  });

  it('should emit a value that is set', async () => {
    const store = useDividers();

    store.setShown(false);

    expect(await readKnown(store.shown)).toBe(false);
  });

  it('should restore hidden dividers in a new store, as after a reload', async () => {
    useDividers().setShown(false);

    expect(await readKnown(useDividers().shown)).toBe(false);
  });

  it('should restore shown dividers in a new store, as after a reload', async () => {
    const store = useDividers();
    store.setShown(false);
    store.setShown(true);

    expect(await readKnown(useDividers().shown)).toBe(true);
  });

  it('should read the one key both screens share', async () => {
    safeLocalStorage.setItem('trakt-dividers', 'false');

    expect(await readKnown(useDividers().shown)).toBe(false);
  });

  it.each(['true', 'no', ''])(
    'should show the dividers when the stored value is %j',
    async (stored) => {
      safeLocalStorage.setItem('trakt-dividers', stored);

      expect(await readKnown(useDividers().shown)).toBe(true);
    },
  );
});
