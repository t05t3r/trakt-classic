export type FailedStatus = { kind: 'error'; retry: () => void };

export type SectionStatus<T> =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | FailedStatus
  | { kind: 'ready'; data: T };

// A status that judges no data empty, so known data always reads as ready.
export type NeverEmptyStatus<T> = Exclude<SectionStatus<T>, { kind: 'empty' }>;
