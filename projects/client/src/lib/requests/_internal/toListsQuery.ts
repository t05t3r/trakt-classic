import type { ListsType } from '$lib/requests/models/ListsType.ts';

// Three personal lists; official lists at the page size the API defaults to.
const PERSONAL_LISTS_LIMIT = 3;
const OFFICIAL_LISTS_LIMIT = 100;

export function toListsQuery(type: ListsType) {
  return {
    extended: 'images',
    page: 1,
    limit: type === 'personal' ? PERSONAL_LISTS_LIMIT : OFFICIAL_LISTS_LIMIT,
  } as const;
}
