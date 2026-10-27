import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import { toSectionStatus } from '$lib/features/query/toSectionStatus.ts';
import type { EpisodeStats } from '$lib/requests/models/EpisodeStats.ts';
import type { QueryObserverResult } from '@tanstack/query-core';

export function toCommentsStatus(
  result: QueryObserverResult<EpisodeStats>,
): SectionStatus<number> {
  return toSectionStatus({
    result,
    select: (stats) => stats.comments,
    isEmpty: (count) => count === 0,
  });
}
