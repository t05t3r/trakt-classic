import { filter, firstValueFrom, type Observable } from 'rxjs';

export function readKnown<T>(source: Observable<T | undefined>): Promise<T> {
  return firstValueFrom(
    source.pipe(filter((value): value is T => value !== undefined)),
  );
}
