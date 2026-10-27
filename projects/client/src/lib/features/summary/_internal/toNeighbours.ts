import type { Pathname } from '$app/types';
import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
import type { Season } from '$lib/requests/models/Season.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
import { highest } from './highest.ts';
import { lowest } from './lowest.ts';
import { nearestNumber } from './nearestNumber.ts';

export type Neighbours = { previous?: Pathname; next?: Pathname };

export type SeasonEpisodes = {
  season: number;
  episodes: ReadonlyArray<EpisodeEntry>;
};

// The adjacent seasons' lists cross a season end, so a show that numbers its episodes across seasons links right.
type EpisodeInSeason = {
  number: number;
  episodes: ReadonlyArray<EpisodeEntry>;
  previousSeason?: SeasonEpisodes;
  nextSeason?: SeasonEpisodes;
};

type Place = { slug: string; season: number };

type ForEpisode = Place & { episode: EpisodeInSeason };

type ToNeighboursParams =
  | (Place & { seasons: ReadonlyArray<Season> })
  | ForEpisode;

const numbersOf = (entries: ReadonlyArray<{ number: number }>) =>
  entries.map(({ number }) => number);

const below = (numbers: ReadonlyArray<number>, current: number) =>
  nearestNumber({ numbers, current, side: 'below' });

const above = (numbers: ReadonlyArray<number>, current: number) =>
  nearestNumber({ numbers, current, side: 'above' });

const seasonLink = (slug: string, season: number | undefined) =>
  season === undefined ? undefined : UrlBuilder.season(slug, season);

const episodeLink = (
  slug: string,
  { season, number }: { season: number; number: number | undefined },
) =>
  number === undefined ? undefined : UrlBuilder.episode(slug, season, number);

function previousEpisode(
  { slug, season, episode }: ForEpisode,
): Pathname | undefined {
  const within = below(numbersOf(episode.episodes), episode.number);
  if (within !== undefined) return UrlBuilder.episode(slug, season, within);

  const before = episode.previousSeason;
  if (!before) return undefined;

  return episodeLink(slug, {
    season: before.season,
    number: highest(numbersOf(before.episodes)),
  });
}

function nextEpisode(
  { slug, season, episode }: ForEpisode,
): Pathname | undefined {
  const within = above(numbersOf(episode.episodes), episode.number);
  if (within !== undefined) return UrlBuilder.episode(slug, season, within);

  const after = episode.nextSeason;
  if (!after) return undefined;

  return episodeLink(slug, {
    season: after.season,
    number: lowest(numbersOf(after.episodes)),
  });
}

export function toNeighbours(params: ToNeighboursParams): Neighbours {
  if ('episode' in params) {
    return { previous: previousEpisode(params), next: nextEpisode(params) };
  }

  const { slug, season } = params;
  const numbers = numbersOf(params.seasons);

  return {
    previous: seasonLink(slug, below(numbers, season)),
    next: seasonLink(slug, above(numbers, season)),
  };
}
