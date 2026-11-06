import { readKnown } from '$test/beds/store/readKnown.ts';
import { map, type Observable } from 'rxjs';

export function readingOf<R, K extends keyof R>(
  reading: Observable<R>,
  key: K,
) {
  return readKnown(reading.pipe(map((current) => current[key])));
}
