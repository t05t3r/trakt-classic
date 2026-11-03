import type { LIST_TYPES, ListDisplayType } from './LIST_TYPES.ts';

const SEGMENTS = {
  movie: 'movies',
  show: 'shows',
  season: 'seasons',
  episode: 'episodes',
} as const satisfies Record<ListDisplayType, string>;

export type ListTypeSegment<K extends keyof typeof LIST_TYPES> = ReturnType<
  typeof toListTypeSegment<(typeof LIST_TYPES)[K][number]>
>;

export function toListTypeSegment<T extends ListDisplayType>(
  type: T | null,
): (typeof SEGMENTS)[T] | 'all' {
  if (type === null) return 'all';
  return SEGMENTS[type];
}
