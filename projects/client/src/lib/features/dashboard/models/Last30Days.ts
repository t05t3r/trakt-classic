import type { LocalDay } from '$lib/utils/date/bucketByWindowDay.ts';
import type { Count } from '$lib/utils/formatting/number/countText.ts';

export type PlayCount = Count;

export type Last30Day = LocalDay & {
  minutes: number;
  episodes: PlayCount;
  movies: PlayCount;
};

export type GenreShare = {
  slug: string;
  share: number;
  episodes: PlayCount;
  shows: number;
  movies: PlayCount;
};

export type Last30Days = {
  days: ReadonlyArray<Last30Day>;
  totals: {
    minutes: number;
    episodes: PlayCount;
    movies: PlayCount;
  };
  genres: ReadonlyArray<GenreShare>;
  now: Date;
};
