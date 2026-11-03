import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import type { WatchedFilter } from './stores/useWatchedFilter.ts';

type WithWatchedKnownParams<T> = {
  status: SectionStatus<T>;
  filter: WatchedFilter | null;
  known: SectionStatus<unknown>;
};

// Under a filter, an unknown watched state would show a watched item as unwatched.
export function withWatchedKnown<T>(
  { status, filter, known }: WithWatchedKnownParams<T>,
): SectionStatus<T> {
  if (filter === null) return status;
  if (known.kind === 'loading' || known.kind === 'error') return known;

  return status;
}
