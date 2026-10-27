import type { ListItem } from '$lib/requests/models/ListItem.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { WatchlistPreviewMappedMock } from '$mocks/data/sync/mapped/WatchlistPreviewMappedMock.ts';

export function itemOfType<T extends ListItem['type']>(
  type: T,
): Extract<ListItem, { type: T }> {
  return assertDefined(
    WatchlistPreviewMappedMock.find(
      (entry): entry is Extract<ListItem, { type: T }> => entry.type === type,
    ),
  );
}
