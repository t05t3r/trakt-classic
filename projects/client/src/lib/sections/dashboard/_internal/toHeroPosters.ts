import { isPlaceholder } from '$lib/features/image/isPlaceholder.ts';
import type { ListItem } from '$lib/requests/models/ListItem.ts';
import type { UpNextEntry } from '$lib/requests/models/UpNextEntry.ts';
import { toListItemPoster } from './toListItemPoster.ts';

// The wall's cell count; Up Next fills at most half, the Watchlist the rest.
const POSTER_MAX = 24;
const UP_NEXT_MAX = POSTER_MAX / 2;

type HeroPostersParams = {
  upNext: ReadonlyArray<UpNextEntry>;
  watchlist: ReadonlyArray<ListItem>;
};

function distinctPosters(
  { from, taken, max }: {
    from: ReadonlyArray<string>;
    taken: ReadonlyArray<string>;
    max: number;
  },
): ReadonlyArray<string> {
  return from.reduce<ReadonlyArray<string>>(
    (posters, url) =>
      posters.length >= max || isPlaceholder(url) || posters.includes(url)
        ? posters
        : [...posters, url],
    taken,
  );
}

export function toHeroPosters(
  { upNext, watchlist }: HeroPostersParams,
): ReadonlyArray<string> {
  const fromUpNext = distinctPosters({
    from: upNext.map((entry) => entry.show.poster.url.thumb),
    taken: [],
    max: UP_NEXT_MAX,
  });

  return distinctPosters({
    from: watchlist.map((item) => toListItemPoster(item).url.thumb),
    taken: fromUpNext,
    max: POSTER_MAX,
  });
}
