import {
  BehaviorSubject,
  distinctUntilChanged,
  map,
  type Observable,
} from 'rxjs';

export type PendingOverrideAction =
  | 'watched'
  | 'rating'
  | 'watchlist'
  | 'list'
  | 'favorite'
  | 'drop';

export type PendingOverrideKey = {
  action: PendingOverrideAction;
  targetKey: string;
  listId?: string | number;
};

export type PendingOverride = PendingOverrideKey & {
  value: boolean | number | null;
  requestId: string;
};

const overrides = new BehaviorSubject<ReadonlyMap<string, PendingOverride>>(
  new Map(),
);

function toId({ action, targetKey, listId }: PendingOverrideKey): string {
  return JSON.stringify([
    action,
    targetKey,
    listId == null ? null : `${listId}`,
  ]);
}

function set(override: PendingOverride): void {
  overrides.next(new Map(overrides.value).set(toId(override), override));
}

function clear(
  { requestId, ...key }: PendingOverrideKey & { requestId: string },
): void {
  const id = toId(key);
  if (overrides.value.get(id)?.requestId !== requestId) return;

  const remaining = new Map(overrides.value);
  remaining.delete(id);
  overrides.next(remaining);
}

function reset(): void {
  overrides.next(new Map());
}

function get(key: PendingOverrideKey): PendingOverride | undefined {
  return overrides.value.get(toId(key));
}

function isAnyPending(action: PendingOverrideAction): boolean {
  return [...overrides.value.values()].some((override) =>
    override.action === action
  );
}

function lookup$(
  key: PendingOverrideKey,
): Observable<PendingOverride | undefined> {
  const id = toId(key);

  return overrides.pipe(
    map((current) => current.get(id)),
    distinctUntilChanged(),
  );
}

const isSameList = (
  previous: ReadonlyArray<PendingOverride>,
  next: ReadonlyArray<PendingOverride>,
) =>
  previous.length === next.length &&
  previous.every((override, index) => override === next.at(index));

function byAction$(
  action: PendingOverrideAction,
): Observable<ReadonlyArray<PendingOverride>> {
  return overrides.pipe(
    map((current) =>
      [...current.values()].filter((override) => override.action === action)
    ),
    distinctUntilChanged(isSameList),
  );
}

export const pendingOverrides = {
  set,
  clear,
  get,
  isAnyPending,
  lookup$,
  byAction$,
  reset,
};
