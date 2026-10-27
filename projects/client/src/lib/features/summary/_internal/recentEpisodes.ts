import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
import type { ShowProgressDetail } from '$lib/requests/models/ShowProgressDetail.ts';
import { RECENT_EPISODES_CARD_COUNT } from './RECENT_EPISODES_CARD_COUNT.ts';

export type RecentEpisodes = {
  upNext: EpisodeEntry | null;
  recentlyAired: ReadonlyArray<EpisodeEntry>;
};

type EpisodeList = ReadonlyArray<EpisodeEntry>;

type RecentEpisodesParams = {
  last: EpisodeEntry | Nil;
  lastSeason: EpisodeList | Nil;
  progress: Pick<ShowProgressDetail, 'completed' | 'nextEpisode'> | Nil;
  firstSeasonNumber: number | Nil;
  firstSeason: EpisodeList | Nil;
  previousSeasonNumber: number | Nil;
  previousSeason: EpisodeList | Nil;
  now: Date;
};

function upNextOf(
  { progress, firstSeasonNumber, firstSeason }: Pick<
    RecentEpisodesParams,
    'progress' | 'firstSeasonNumber' | 'firstSeason'
  >,
): EpisodeEntry | null {
  if (!progress) return null;
  if (progress.completed > 0) return progress.nextEpisode;

  return firstSeason?.find(({ season, number }) =>
    season === firstSeasonNumber && number === 1
  ) ?? null;
}

function predecessorsOf(
  { last, lastSeason, now }: {
    last: EpisodeEntry;
    lastSeason: EpisodeList | Nil;
    now: Date;
  },
): EpisodeList {
  return (lastSeason ?? [])
    .filter(({ season, number, airDate }) =>
      season === last.season && number < last.number && airDate <= now
    )
    .toSorted((a, b) => b.number - a.number);
}

function previousSeasonEpisodesOf(
  { previousSeasonNumber, previousSeason, now }: Pick<
    RecentEpisodesParams,
    'previousSeasonNumber' | 'previousSeason' | 'now'
  >,
): EpisodeList {
  return (previousSeason ?? [])
    .filter(({ season, airDate }) =>
      season === previousSeasonNumber && airDate <= now
    )
    .toSorted((a, b) => b.number - a.number);
}

export function recentEpisodes(params: RecentEpisodesParams): RecentEpisodes {
  const { last, lastSeason, now } = params;
  if (!last) return { upNext: null, recentlyAired: [] };

  const upNext = upNextOf(params);
  const recentlyAired = [
    last,
    ...predecessorsOf({ last, lastSeason, now }),
    ...previousSeasonEpisodesOf(params),
  ]
    .filter(({ id }) => id !== upNext?.id)
    .slice(0, RECENT_EPISODES_CARD_COUNT - (upNext ? 1 : 0));

  return { upNext, recentlyAired };
}
