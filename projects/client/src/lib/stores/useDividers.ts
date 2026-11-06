import { safeLocalStorage } from '$lib/utils/storage/safeLocalStorage.ts';
import { BehaviorSubject, type Observable } from 'rxjs';

const DIVIDERS_STORAGE_KEY = 'trakt-dividers';

export type Dividers = {
  shown: Observable<boolean>;
  setShown: (shown: boolean) => void;
};

// Read once, as the store is made, so a page renders its stored choice first.
export function useDividers(): Dividers {
  const shown = new BehaviorSubject(
    safeLocalStorage.getItem(DIVIDERS_STORAGE_KEY) !== 'false',
  );

  return {
    shown: shown.asObservable(),
    setShown: (next) => {
      safeLocalStorage.setItem(DIVIDERS_STORAGE_KEY, String(next));
      shown.next(next);
    },
  };
}
