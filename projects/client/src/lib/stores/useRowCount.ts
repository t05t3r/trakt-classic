import { safeLocalStorage } from '$lib/utils/storage/safeLocalStorage.ts';
import { BehaviorSubject } from 'rxjs';

const ROW_COUNT_STORAGE_KEY = 'trakt-row-count';

type UseRowCountProps = {
  // The section's own name, so each section keeps its own count.
  key: string;
  rowMax: number;
  defaultCount: number;
};

function readStoredCount(
  { storageKey, rowMax, defaultCount }:
    & Omit<UseRowCountProps, 'key'>
    & { storageKey: string },
): number {
  const stored = Number(safeLocalStorage.getItem(storageKey) ?? Number.NaN);
  if (!Number.isInteger(stored)) return defaultCount;
  if (stored < 1 || stored > rowMax) return defaultCount;

  return stored;
}

// Read once, as the store is made, so a section renders its stored count first.
export function useRowCount({ key, rowMax, defaultCount }: UseRowCountProps) {
  const storageKey = `${ROW_COUNT_STORAGE_KEY}:${key}`;
  const rowCount = new BehaviorSubject(
    readStoredCount({ storageKey, rowMax, defaultCount }),
  );

  return {
    rowCount: rowCount.asObservable(),
    setRowCount: (count: number) => {
      safeLocalStorage.setItem(storageKey, String(count));
      rowCount.next(count);
    },
  };
}
