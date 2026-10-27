export type SectionStatus<T> =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'error'; retry: () => void }
  | { kind: 'ready'; data: T };
