import { BehaviorSubject, type Observable } from 'rxjs';

const state = new BehaviorSubject<boolean>(false);

export function isHydrated(): boolean {
  return state.value;
}

export function setHydrated(hydrated: boolean): void {
  if (state.value === hydrated) return;

  state.next(hydrated);
}

const hydrated$: Observable<boolean> = state.asObservable();

export function useHydrated(): Observable<boolean> {
  return hydrated$;
}
