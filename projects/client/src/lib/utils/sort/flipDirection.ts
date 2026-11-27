import type { SortDirection } from '$lib/models/SortDirection.ts';

export function flipDirection(how: SortDirection): SortDirection {
  return how === 'asc' ? 'desc' : 'asc';
}
