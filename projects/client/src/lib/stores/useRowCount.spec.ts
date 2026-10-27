import { safeLocalStorage } from '$lib/utils/storage/safeLocalStorage.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { afterEach, describe, expect, it } from 'vitest';
import { useRowCount } from './useRowCount.ts';

const UP_NEXT = { key: 'on_deck', rowMax: 3, defaultCount: 3 };

function readRowCount(store: ReturnType<typeof useRowCount>) {
  return runQuery({ factory: () => store.rowCount });
}

describe('store: useRowCount', () => {
  afterEach(() => safeLocalStorage.clear());

  it('should start at the default count when none is stored', async () => {
    expect(await readRowCount(useRowCount(UP_NEXT))).toBe(3);
  });

  it('should emit a count that is set', async () => {
    const store = useRowCount(UP_NEXT);

    store.setRowCount(2);

    expect(await readRowCount(store)).toBe(2);
  });

  it('should restore a set count in a new store for the same section', async () => {
    useRowCount(UP_NEXT).setRowCount(1);

    expect(await readRowCount(useRowCount(UP_NEXT))).toBe(1);
  });

  it("should keep each section's count apart", async () => {
    useRowCount(UP_NEXT).setRowCount(1);

    expect(await readRowCount(useRowCount({ ...UP_NEXT, key: 'list' })))
      .toBe(3);
  });

  it.each([
    ['above the row max', '4'],
    ['below one', '0'],
    ['not a whole number', '1.5'],
    ['not a number', 'two'],
    ['empty', ''],
  ])(
    'should start at the default count when the stored one is %s',
    async (_, stored) => {
      safeLocalStorage.setItem('trakt-row-count:on_deck', stored);

      expect(await readRowCount(useRowCount(UP_NEXT))).toBe(3);
    },
  );
});
