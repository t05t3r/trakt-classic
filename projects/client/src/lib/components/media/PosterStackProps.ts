import type { Snippet } from 'svelte';

export type PosterStackProps<T> = {
  items: ReadonlyArray<T>;
  key: (item: T) => string;
  poster: Snippet<[T]>;
};
