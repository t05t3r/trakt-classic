import { map, type Observable } from 'rxjs';

export function statusOf<S>(
  reading: Observable<Readonly<{ status: S }>>,
): Observable<S> {
  return reading.pipe(map(({ status }) => status));
}
