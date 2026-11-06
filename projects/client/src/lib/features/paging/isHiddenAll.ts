import { isEmpty } from '$lib/utils/array/isEmpty.ts';
import type { PagedCard, PagedReading } from './stores/usePagedItems.ts';

// An empty status with entries means a hide left none of the page's entries.
export function isHiddenAll<E, C extends PagedCard>(
  { status, entries }: Pick<PagedReading<E, C>, 'status' | 'entries'>,
): boolean {
  return status.kind === 'empty' && !isEmpty(entries ?? []);
}
