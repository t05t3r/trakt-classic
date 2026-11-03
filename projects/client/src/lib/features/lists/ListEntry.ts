import type { FavoritedEntry } from '$lib/requests/models/FavoritedEntry.ts';
import type { ListItem } from '$lib/requests/models/ListItem.ts';

export type ListEntry = ListItem | FavoritedEntry;
