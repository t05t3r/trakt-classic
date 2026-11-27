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
  | 'drop'
  | 'hide'
  | 'hideProgress';

export type PendingOverrideKey = {
  action: PendingOverrideAction;
  targetKey: string;
  listId?: string | number;
};

export type PendingOverride = PendingOverrideKey & {
  value: boolean | number | null;
  requestId: string;
};

type OwnKey = PendingOverrideKey & { requestId: string };

type OverrideMap = ReadonlyMap<string, PendingOverride>;

// A landed write's override stays kept, below the writes in flight, until the read it waits on.
type Layers = {
  inFlight: OverrideMap;
  kept: OverrideMap;
};

const layers = new BehaviorSubject<Layers>({
  inFlight: new Map(),
  kept: new Map(),
});

function toId({ action, targetKey, listId }: PendingOverrideKey): string {
  return JSON.stringify([
    action,
    targetKey,
    listId == null ? null : `${listId}`,
  ]);
}

function without(overrides: OverrideMap, id: string): OverrideMap {
  const remaining = new Map(overrides);
  remaining.delete(id);
  return remaining;
}

const ownInFlight = (id: string, requestId: string) => {
  const override = layers.value.inFlight.get(id);
  return override?.requestId === requestId ? override : undefined;
};

function set(override: PendingOverride): void {
  const { inFlight, kept } = layers.value;
  layers.next({
    inFlight: new Map(inFlight).set(toId(override), override),
    kept,
  });
}

function clear({ requestId, ...key }: OwnKey): void {
  const id = toId(key);
  if (!ownInFlight(id, requestId)) return;

  layers.next({
    ...layers.value,
    inFlight: without(layers.value.inFlight, id),
  });
}

// With a requestId, only that write's kept entry drops.
function dropKeptEntry(id: string, requestId?: string): void {
  const entry = layers.value.kept.get(id);
  if (entry === undefined) return;
  if (requestId !== undefined && entry.requestId !== requestId) return;

  layers.next({ ...layers.value, kept: without(layers.value.kept, id) });
}

function keep(
  { requestId, until, ...key }: OwnKey & { until?: Promise<void> },
): void {
  const id = toId(key);
  const override = ownInFlight(id, requestId);
  if (!override) return;

  const { inFlight, kept } = layers.value;
  layers.next({
    inFlight: without(inFlight, id),
    kept: new Map(kept).set(id, override),
  });
  void until?.then(() => dropKeptEntry(id, requestId));
}

function dropKept({ requestId, ...key }: OwnKey): void {
  const id = toId(key);
  if (!ownInFlight(id, requestId)) return;

  dropKeptEntry(id);
}

function reset(): void {
  layers.next({ inFlight: new Map(), kept: new Map() });
}

function get(key: PendingOverrideKey): PendingOverride | undefined {
  return layers.value.inFlight.get(toId(key));
}

function isAnyPending(action: PendingOverrideAction): boolean {
  return [...layers.value.inFlight.values()].some((override) =>
    override.action === action
  );
}

const keysOf = (overrides: OverrideMap, action: PendingOverrideAction) =>
  [...overrides.values()]
    .filter((override) => override.action === action)
    .map(({ targetKey, listId }): PendingOverrideKey => ({
      action,
      targetKey,
      listId,
    }));

function inFlightOf(
  action: PendingOverrideAction,
): ReadonlyArray<PendingOverrideKey> {
  return keysOf(layers.value.inFlight, action);
}

const toIds = (keys: ReadonlyArray<PendingOverrideKey>) =>
  JSON.stringify(keys.map(toId));

const isSameKeys = (
  previous: ReadonlyArray<PendingOverrideKey>,
  next: ReadonlyArray<PendingOverrideKey>,
) => toIds(previous) === toIds(next);

function inFlightOf$(
  action: PendingOverrideAction,
): Observable<ReadonlyArray<PendingOverrideKey>> {
  return layers.pipe(
    map(({ inFlight }) => keysOf(inFlight, action)),
    distinctUntilChanged(isSameKeys),
  );
}

function lookup$(
  key: PendingOverrideKey,
): Observable<PendingOverride | undefined> {
  const id = toId(key);

  return layers.pipe(
    map(({ inFlight, kept }) => inFlight.get(id) ?? kept.get(id)),
    distinctUntilChanged(),
  );
}

function isInFlight$(
  keys: ReadonlyArray<PendingOverrideKey>,
): Observable<boolean> {
  const ids = keys.map(toId);

  return layers.pipe(
    map(({ inFlight }) => ids.some((id) => inFlight.has(id))),
    distinctUntilChanged(),
  );
}

const valuesByTarget = (
  overrides: OverrideMap,
  action: PendingOverrideAction,
): ReadonlyArray<readonly [string, boolean]> =>
  [...overrides.values()]
    .filter((override) => override.action === action)
    .map((override) => [override.targetKey, override.value === true]);

const isSameMap = (
  previous: ReadonlyMap<string, boolean>,
  next: ReadonlyMap<string, boolean>,
) =>
  previous.size === next.size &&
  [...previous].every(([targetKey, value]) => next.get(targetKey) === value);

function valuesOf$(
  action: PendingOverrideAction,
): Observable<(targetKey: string) => boolean | undefined> {
  return layers.pipe(
    map(({ inFlight, kept }) =>
      new Map([
        ...valuesByTarget(kept, action),
        ...valuesByTarget(inFlight, action),
      ])
    ),
    distinctUntilChanged(isSameMap),
    map((values) => (targetKey: string) => values.get(targetKey)),
  );
}

export const pendingOverrides = {
  set,
  clear,
  keep,
  dropKept,
  get,
  isAnyPending,
  inFlightOf,
  inFlightOf$,
  lookup$,
  isInFlight$,
  valuesOf$,
  reset,
};
