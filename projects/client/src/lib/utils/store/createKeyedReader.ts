import { BehaviorSubject, type Observable, switchMap } from 'rxjs';

export type KeyedReaderParams<T, R> = {
  initial: T;
  read: (current: T) => Observable<R>;
};

// A keyed reader hands each new value to `latest`, and `reading` drops the one before it.
export function createKeyedReader<T, R>(
  { initial, read }: KeyedReaderParams<T, R>,
) {
  const latest = new BehaviorSubject<T>(initial);

  return { latest, reading: latest.pipe(switchMap(read)) };
}
