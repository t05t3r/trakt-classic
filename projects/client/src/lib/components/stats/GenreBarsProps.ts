import type { Pathname } from '$app/types';
import type { Count } from '$lib/utils/formatting/number/countText.ts';

export type GenreCount = Count & { href: Pathname };

export type GenreBar = {
  key: string;
  name: string;
  share: number;
  episodes: GenreCount;
  shows: { distinct: number; href: Pathname };
  movies: GenreCount;
};

export type GenreBarsProps = {
  genres: ReadonlyArray<GenreBar>;
};
