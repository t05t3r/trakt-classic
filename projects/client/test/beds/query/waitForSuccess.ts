import { filter, firstValueFrom, type Observable } from 'rxjs';

export function waitForSuccess<T extends { readonly isSuccess: boolean }>(
  query: Observable<T>,
): Promise<T> {
  return firstValueFrom(query.pipe(filter(({ isSuccess }) => isSuccess)));
}
