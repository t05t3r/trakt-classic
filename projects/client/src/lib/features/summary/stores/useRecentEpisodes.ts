import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import { toSectionStatus } from '$lib/features/query/toSectionStatus.ts';
import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
import type { Season } from '$lib/requests/models/Season.ts';
import type { ShowProgressDetail } from '$lib/requests/models/ShowProgressDetail.ts';
import { showLastEpisodeQuery } from '$lib/requests/queries/shows/showLastEpisodeQuery.ts';
import { showProgressQuery } from '$lib/requests/queries/shows/showProgressQuery.ts';
import { showSeasonsQuery } from '$lib/requests/queries/shows/showSeasonsQuery.ts';
import { combineLatest, filter, map, type Observable } from 'rxjs';
import { firstSeasonNumber } from '$lib/features/summary/_internal/firstSeasonNumber.ts';
import { previousSeasonNumber } from '$lib/features/summary/_internal/previousSeasonNumber.ts';
import { RECENT_EPISODES_CARD_COUNT } from '$lib/features/summary/_internal/RECENT_EPISODES_CARD_COUNT.ts';
import {
  type RecentEpisodes,
  recentEpisodes,
} from '$lib/features/summary/_internal/recentEpisodes.ts';
import { isUnsettled } from './_internal/isUnsettled.ts';
import type { SeasonRead } from './_internal/isSameRead.ts';
import { listFor } from './_internal/listFor.ts';
import { type Tagged, useTaggedQuery } from './_internal/useTaggedQuery.ts';
import {
  type EpisodesRead,
  useSeasonEpisodes,
} from './_internal/useSeasonEpisodes.ts';

type Reads = {
  last: Tagged<string, EpisodeEntry | null>;
  lastSeason: EpisodesRead | undefined;
  progress: Tagged<string, ShowProgressDetail>;
  seasons: Tagged<string, ReadonlyArray<Season>>;
  firstSeason: EpisodesRead | undefined;
  previousSeason: EpisodesRead | undefined;
};

const LOADING: SectionStatus<RecentEpisodes> = { kind: 'loading' };

const isEmpty = ({ upNext, recentlyAired }: RecentEpisodes) =>
  upNext === null && recentlyAired.length === 0;

// Up Next's season number; null when progress does not read nothing watched or no season has episodes,
// undefined while the seasons read is unsettled.
function upNextSeason(
  { progress, seasons }: Pick<Reads, 'progress' | 'seasons'>,
): number | null | undefined {
  if (progress.result.data?.completed !== 0) return null;
  if (isUnsettled(seasons.result)) return undefined;

  return firstSeasonNumber(seasons.result.data ?? []) ?? null;
}

// The season that fills the row when the last episode's season may hold too few cards;
// null when no season fills it, undefined while the seasons read is unsettled.
function fillSeason(
  { last, seasons }: Pick<Reads, 'last' | 'seasons'>,
): number | null | undefined {
  const episode = last.result.data;
  if (!episode || episode.number >= RECENT_EPISODES_CARD_COUNT) return null;
  if (isUnsettled(seasons.result)) return undefined;

  return previousSeasonNumber({
    seasons: seasons.result.data ?? [],
    season: episode.season,
  }) ?? null;
}

function isConsistent(
  { last, progress, seasons }: Pick<Reads, 'last' | 'progress' | 'seasons'>,
): boolean {
  return last.read === progress.read && progress.read === seasons.read;
}

function seasonRead(
  { last, season }: { last: Reads['last']; season: number | null | undefined },
): SeasonRead | undefined {
  if (!last.result.data) return undefined;
  if (typeof season !== 'number') return undefined;

  return { slug: last.read, season };
}

function toStatus(reads: Reads): SectionStatus<RecentEpisodes> {
  if (!isConsistent(reads)) return LOADING;

  const { last, progress } = reads;
  const episode = last.result.data;
  const season = upNextSeason(reads);
  const fill = fillSeason(reads);
  const lastSeason = listFor(
    reads.lastSeason,
    episode ? { slug: last.read, season: episode.season } : undefined,
  );
  const firstSeason = listFor(reads.firstSeason, seasonRead({ last, season }));
  const previousSeason = listFor(
    reads.previousSeason,
    seasonRead({ last, season: fill }),
  );
  const needed = [
    progress.result,
    lastSeason,
    ...(season === null ? [] : [firstSeason]),
    ...(fill === null ? [] : [previousSeason]),
  ];
  if (episode && needed.some(isUnsettled)) return LOADING;

  return toSectionStatus({
    result: last.result,
    select: (entry) =>
      recentEpisodes({
        last: entry,
        lastSeason: lastSeason?.data,
        progress: progress.result.data,
        firstSeasonNumber: season,
        firstSeason: firstSeason?.data,
        previousSeasonNumber: fill,
        previousSeason: previousSeason?.data,
        now: new Date(),
      }),
    isEmpty,
  });
}

export function useRecentEpisodes(
  slug$: Observable<string>,
): Observable<SectionStatus<RecentEpisodes>> {
  const last = useTaggedQuery(slug$, (slug) => showLastEpisodeQuery({ slug }));
  const progress = useTaggedQuery(slug$, (slug) => showProgressQuery({ slug }));
  const seasons = useTaggedQuery(slug$, (slug) => showSeasonsQuery({ slug }));
  const lastSeason = useSeasonEpisodes(
    last.pipe(
      map(({ read: slug, result: { data } }) =>
        data ? { slug, season: data.season } : undefined
      ),
    ),
  );
  const consistent = combineLatest({ last, progress, seasons }).pipe(
    filter(isConsistent),
  );
  const firstSeason = useSeasonEpisodes(
    consistent.pipe(
      map((reads) =>
        seasonRead({ last: reads.last, season: upNextSeason(reads) })
      ),
    ),
  );
  const previousSeason = useSeasonEpisodes(
    consistent.pipe(
      map((reads) =>
        seasonRead({ last: reads.last, season: fillSeason(reads) })
      ),
    ),
  );

  return combineLatest({
    last,
    lastSeason,
    progress,
    seasons,
    firstSeason,
    previousSeason,
  }).pipe(map(toStatus));
}
