import { toFavoritedInput } from '$lib/features/media-card/toFavoritedInput.ts';
import { nonNegativeFinite } from '$lib/utils/number/nonNegativeFinite.ts';
import type { ListEntry } from './ListEntry.ts';
import { isFavorited } from './_internal/isFavorited.ts';

function toRawRuntime(item: ListEntry): number {
  if (isFavorited(item)) {
    const input = toFavoritedInput(item);
    return input.type === 'show'
      ? input.show.totalRuntime
      : input.movie.runtime;
  }

  switch (item.type) {
    case 'movie':
      return item.entry.runtime;
    case 'show':
      return item.entry.totalRuntime;
    case 'episode':
      return item.entry.episode.runtime;
    case 'season': {
      const { season, show } = item.entry;
      return isNaN(season.totalRuntime)
        ? show.runtime * season.episodes.count
        : season.totalRuntime;
    }
  }
}

// The mappers fill an unknown runtime with NaN, which would poison a sum.
export function toItemRuntime(item: ListEntry): number {
  return nonNegativeFinite(toRawRuntime(item));
}
