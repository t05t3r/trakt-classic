import { combineLatest, map, type Observable } from 'rxjs';
import {
  type PendingOverride,
  type PendingOverrideKey,
  pendingOverrides,
} from './pendingOverrides.ts';

type PendingOverrideParams<S, T> = {
  key: PendingOverrideKey;
  snapshot: Observable<S>;
  fromSnapshot: (snapshot: S) => T;
};

type OverrideReading<T> = {
  fromOverride: (value: PendingOverride['value']) => T;
};

type PendingOverrideRead<T> = {
  value: Observable<T>;
  isUpdating: Observable<boolean>;
};

const isTrue = (value: PendingOverride['value']) => value === true;

// An override, in flight or kept, reads over the snapshot; only one in flight reads as updating.
export function withPendingOverride<S, T>(
  params: PendingOverrideParams<S, T> & OverrideReading<T>,
): PendingOverrideRead<T>;
export function withPendingOverride<S>(
  params: PendingOverrideParams<S, boolean | undefined>,
): PendingOverrideRead<boolean | undefined>;
export function withPendingOverride<S, T>(
  { key, snapshot, fromSnapshot, fromOverride = isTrue }:
    & PendingOverrideParams<S, T | boolean | undefined>
    & Partial<OverrideReading<T | boolean>>,
): PendingOverrideRead<T | boolean | undefined> {
  const value = combineLatest([snapshot, pendingOverrides.lookup$(key)]).pipe(
    map(([$snapshot, override]) =>
      override ? fromOverride(override.value) : fromSnapshot($snapshot)
    ),
  );

  return { value, isUpdating: pendingOverrides.isInFlight$([key]) };
}
