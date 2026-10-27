import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import { filter, firstValueFrom, type Observable } from 'rxjs';

type StatusOf<T, K extends SectionStatus<T>['kind']> = Extract<
  SectionStatus<T>,
  { kind: K }
>;

export function nextOf<T, K extends SectionStatus<T>['kind']>(
  status: Observable<SectionStatus<T>>,
  kind: K,
): Promise<StatusOf<T, K>> {
  return firstValueFrom(
    status.pipe(filter((read): read is StatusOf<T, K> => read.kind === kind)),
  );
}
