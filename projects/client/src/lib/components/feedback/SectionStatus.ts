export type FailedStatus = { kind: 'error'; retry: () => void };

export type SectionStatus<T> =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | FailedStatus
  | { kind: 'ready'; data: T };
