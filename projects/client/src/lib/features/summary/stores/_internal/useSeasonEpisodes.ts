import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
import { showSeasonEpisodesQuery } from '$lib/requests/queries/shows/showSeasonEpisodesQuery.ts';
import { distinctUntilChanged, filter, type Observable, startWith } from 'rxjs';
import { isSameRead, type SeasonRead } from './isSameRead.ts';
import { type Tagged, useTaggedQuery } from './useTaggedQuery.ts';

export type EpisodesRead = Tagged<SeasonRead, ReadonlyArray<EpisodeEntry>>;

export function useSeasonEpisodes(
  read$: Observable<SeasonRead | undefined>,
): Observable<EpisodesRead | undefined> {
  return useTaggedQuery(
    read$.pipe(
      filter((read) => read !== undefined),
      distinctUntilChanged(isSameRead),
    ),
    (read) => showSeasonEpisodesQuery(read),
  ).pipe(startWith(undefined));
}
