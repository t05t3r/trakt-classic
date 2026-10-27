import { BehaviorSubject, type Observable } from 'rxjs';

const hidden = new BehaviorSubject<ReadonlySet<string>>(new Set());

function add(targetKey: string): void {
  if (hidden.value.has(targetKey)) return;

  hidden.next(new Set(hidden.value).add(targetKey));
}

function remove(targetKey: string): void {
  if (!hidden.value.has(targetKey)) return;

  const remaining = new Set(hidden.value);
  remaining.delete(targetKey);
  hidden.next(remaining);
}

function reset(): void {
  if (hidden.value.size === 0) return;

  hidden.next(new Set());
}

function has(targetKey: string): boolean {
  return hidden.value.has(targetKey);
}

const keys$: Observable<ReadonlySet<string>> = hidden.asObservable();

export const hiddenRecommendations = { add, remove, has, keys$, reset };
