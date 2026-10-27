import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
import type { QueryObserverResult } from '@tanstack/query-core';
import { isSameRead, type SeasonRead } from './isSameRead.ts';
import type { EpisodesRead } from './useSeasonEpisodes.ts';

// A list that answers another show or season is not the one the caller needs.
export function listFor(
  list: EpisodesRead | undefined,
  read: SeasonRead | undefined,
): QueryObserverResult<ReadonlyArray<EpisodeEntry>> | undefined {
  if (!list || !read) return undefined;

  return isSameRead(list.read, read) ? list.result : undefined;
}
