import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import type { QueryObserverResult } from '@tanstack/query-core';
import { readStatus } from './_internal/readStatus.ts';

type ToSectionStatusParams<T> = {
  result: QueryObserverResult<T>;
  isEmpty: (data: T) => boolean;
};

type ToSelectedSectionStatusParams<T, U> = {
  result: QueryObserverResult<T>;
  select: (data: T) => U;
  isEmpty: (data: U) => boolean;
};

type ToGuardedSectionStatusParams<T, U, E extends U> = {
  result: QueryObserverResult<T>;
  select: (data: T) => U;
  isEmpty: (data: U) => data is E;
};

// A type guard keeps what it judges empty out of the ready data's type.
export function toSectionStatus<T, U, E extends U>(
  params: ToGuardedSectionStatusParams<T, U, E>,
): SectionStatus<Exclude<U, E>>;
export function toSectionStatus<T, U>(
  params: ToSelectedSectionStatusParams<T, U>,
): SectionStatus<U>;
export function toSectionStatus<T>(
  params: ToSectionStatusParams<T>,
): SectionStatus<T>;
export function toSectionStatus<T, U>(
  params: ToSectionStatusParams<T> | ToSelectedSectionStatusParams<T, U>,
): SectionStatus<T> | SectionStatus<U> {
  const { result } = params;

  if (!('select' in params)) {
    return readStatus({ data: result.data, result, isEmpty: params.isEmpty });
  }

  const { data } = result;

  return readStatus({
    data: data === undefined ? undefined : params.select(data),
    result,
    isEmpty: params.isEmpty,
  });
}
