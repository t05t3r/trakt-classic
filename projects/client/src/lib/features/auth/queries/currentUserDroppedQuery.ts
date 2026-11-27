import { MAX_PAGE_LIMIT } from '$lib/requests/MAX_PAGE_LIMIT.ts';
import { droppedShowsQuery } from '$lib/requests/queries/users/droppedShowsQuery.ts';

// The one key the dropped Snapshot and a Drop's kept override share.
export const currentUserDroppedQuery = () =>
  droppedShowsQuery({ limit: MAX_PAGE_LIMIT });
