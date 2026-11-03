import * as m from '$lib/features/i18n/messages.ts';
import type { ListItem } from '$lib/requests/models/ListItem.ts';
import type { SortBy } from '$lib/models/SortBy.ts';
import { isMaxDate } from '$lib/utils/date/isMaxDate.ts';
import type { DatePattern } from '$lib/utils/formatting/date/toHumanPatternDate.ts';
import { toGroupedNumber } from '$lib/utils/formatting/number/toGroupedNumber.ts';
import { toTraktRating } from '$lib/utils/formatting/number/toTraktRating.ts';
import type { ListEntry } from './ListEntry.ts';
import { isFavorited } from './_internal/isFavorited.ts';
import { toItemRuntime } from './toItemRuntime.ts';

export type FormattedSortValue =
  | { kind: 'date'; date: Date; zoned: boolean; pattern: DatePattern }
  | { kind: 'minutes'; minutes: number }
  | { kind: 'text'; text: string };

type FormatSortValueParams = {
  item: ListEntry;
  sortBy: SortBy;
  userRating?: number | null;
};

function getAddedAt(item: ListEntry): Date {
  if (isFavorited(item)) return item.favoritedAt;
  return item.listedAt;
}

function getListItemEntry(item: ListItem) {
  switch (item.type) {
    case 'movie':
    case 'show':
      return item.entry;
    case 'episode':
      return item.entry.episode;
    case 'season':
      return item.entry.season;
  }
}

function getMedia(item: ListEntry) {
  return isFavorited(item) ? item.item : getListItemEntry(item);
}

// A movie's release is a date-only day; every other date is an instant.
function isReleaseZoned(item: ListEntry): boolean {
  const type = isFavorited(item) ? item.item.type : item.type;
  return type !== 'movie';
}

function toText(text: string): FormattedSortValue {
  return { kind: 'text', text };
}

export function formatSortValue(
  { item, sortBy, userRating }: FormatSortValueParams,
): FormattedSortValue | undefined {
  switch (sortBy) {
    case 'added':
      return {
        kind: 'date',
        date: getAddedAt(item),
        zoned: true,
        pattern: 'd MMM yyyy HH:mm',
      };
    case 'released': {
      const { airDate } = getMedia(item);
      if (isMaxDate(airDate)) return toText(m.tag_text_tba());

      return {
        kind: 'date',
        date: airDate,
        zoned: isReleaseZoned(item),
        pattern: 'd MMM yyyy',
      };
    }
    case 'runtime': {
      const minutes = toItemRuntime(item);
      return minutes ? { kind: 'minutes', minutes } : undefined;
    }
    case 'percentage': {
      const { rating } = getMedia(item);
      return rating ? toText(toTraktRating(rating)) : undefined;
    }
    case 'votes': {
      const { votes } = getMedia(item);
      return votes ? toText(toGroupedNumber(votes)) : undefined;
    }
    case 'my_rating':
      return userRating != null ? toText(String(userRating)) : undefined;
    case 'rank':
    case 'title':
    case 'popularity':
      return undefined;
  }
}
