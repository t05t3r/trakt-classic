import type { Query } from '@tanstack/query-core';
import type { Held, WhileUnsettled } from './nextHeld.ts';

// `hold` backs every 'hold' read; `known` is the last clean settle an 'unknown' read took.
type SnapshotReads = {
  hold?: Held<unknown>;
  known?: Held<unknown>;
};

const READS = new WeakMap<Query, SnapshotReads>();

const slotOf = (whileUnsettled: WhileUnsettled) =>
  whileUnsettled === 'hold' ? 'hold' : 'known';

export function heldOf<T>(
  query: Query,
  whileUnsettled: WhileUnsettled,
): Held<T> | undefined {
  // A Query's data has one type, so whatever its reads keep has that type too.
  return READS.get(query)?.[slotOf(whileUnsettled)] as Held<T> | undefined;
}

type KeepHeldParams<T> = {
  query: Query;
  whileUnsettled: WhileUnsettled;
  held: Held<T>;
};

export function keepHeld<T>(
  { query, whileUnsettled, held }: KeepHeldParams<T>,
): void {
  const reads = READS.get(query) ?? {};
  // A not known 'unknown' read still marks the Query as read, without dropping its last settle.
  const isNotKnown = whileUnsettled === 'unknown' && held.pages === undefined;

  READS.set(
    query,
    isNotKnown ? reads : { ...reads, [slotOf(whileUnsettled)]: held },
  );
}

export function isSnapshotRead(query: Query): boolean {
  return READS.has(query);
}

// Whether a read settled on data newer than the given data update.
export function isSnapshotCurrent(query: Query, since: number): boolean {
  const reads = READS.get(query);

  return [reads?.hold, reads?.known].some((held) =>
    held?.pages !== undefined && held.count > since
  );
}
