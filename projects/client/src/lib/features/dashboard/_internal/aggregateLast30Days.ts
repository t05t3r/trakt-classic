import type {
  GenreShare,
  Last30Day,
  Last30Days,
  PlayCount,
} from '$lib/features/dashboard/models/Last30Days.ts';
import type { ActivityHistory } from '$lib/requests/queries/users/activityHistoryQuery.ts';
import type { EpisodeActivityHistory } from '$lib/requests/queries/users/episodeActivityHistoryQuery.ts';
import type { MovieActivityHistory } from '$lib/requests/queries/users/movieActivityHistoryQuery.ts';
import {
  bucketByWindowDay,
  type WindowDay,
} from '$lib/utils/date/bucketByWindowDay.ts';

type AggregateLast30DaysParams = {
  entries: ReadonlyArray<ActivityHistory>;
  start: Date;
  days: number;
};

const SHOWN_GENRES = 10;

// The mappers turn a missing runtime into NaN, which `??` does not catch.
function runtimeOf(play: ActivityHistory): number {
  if (play.type === 'movie') return play.movie.runtime;
  if (Number.isNaN(play.episode.runtime)) return play.show.runtime;

  return play.episode.runtime;
}

function minutesOf(play: ActivityHistory): number {
  const runtime = runtimeOf(play);

  return Number.isNaN(runtime) ? 0 : runtime;
}

function sumMinutes(plays: ReadonlyArray<ActivityHistory>): number {
  return plays.reduce((total, play) => total + minutesOf(play), 0);
}

const isEpisodePlay = (play: ActivityHistory): play is EpisodeActivityHistory =>
  play.type === 'episode';

const isMoviePlay = (play: ActivityHistory): play is MovieActivityHistory =>
  play.type === 'movie';

function countPlays<P>(
  plays: ReadonlyArray<P>,
  idOf: (play: P) => number,
): PlayCount {
  return { distinct: new Set(plays.map(idOf)).size, plays: plays.length };
}

const countEpisodes = (plays: ReadonlyArray<ActivityHistory>) =>
  countPlays(plays.filter(isEpisodePlay), ({ episode }) => episode.id);

const countShows = (plays: ReadonlyArray<ActivityHistory>) =>
  new Set(plays.filter(isEpisodePlay).map(({ show }) => show.id)).size;

const countMovies = (plays: ReadonlyArray<ActivityHistory>) =>
  countPlays(plays.filter(isMoviePlay), ({ movie }) => movie.id);

function toDay(
  { key, date, items: plays }: WindowDay<ActivityHistory>,
): Last30Day {
  return {
    key,
    date,
    minutes: sumMinutes(plays),
    episodes: countEpisodes(plays),
    movies: countMovies(plays),
  };
}

// The mapped episode carries no genres, so an episode play takes its show's.
function genresOf(play: ActivityHistory): ReadonlyArray<string> {
  return play.type === 'movie' ? play.movie.genres : play.show.genres;
}

type GenreTags = {
  slug: string;
  plays: ReadonlyArray<ActivityHistory>;
};

function byTagsThenSlug(a: GenreTags, b: GenreTags): number {
  return b.plays.length - a.plays.length || a.slug.localeCompare(b.slug);
}

function toGenres(
  plays: ReadonlyArray<ActivityHistory>,
): ReadonlyArray<GenreShare> {
  const tags = plays.flatMap((play) =>
    genresOf(play).map((slug) => ({ slug, play }))
  );
  const bySlug = Map.groupBy(tags, ({ slug }) => slug);

  return [...bySlug]
    .map(([slug, tagged]) => ({ slug, plays: tagged.map(({ play }) => play) }))
    .toSorted(byTagsThenSlug)
    .slice(0, SHOWN_GENRES)
    .map(({ slug, plays: tagged }) => ({
      slug,
      share: tagged.length / tags.length,
      episodes: countEpisodes(tagged),
      shows: countShows(tagged),
      movies: countMovies(tagged),
    }));
}

export function aggregateLast30Days(
  { entries, start, days }: AggregateLast30DaysParams,
): Omit<Last30Days, 'now'> {
  const windowDays = bucketByWindowDay({
    items: entries,
    dayOf: (play) => play.watchedAt,
    start,
    days,
  });
  const plays = windowDays.flatMap(({ items }) => items);

  return {
    days: windowDays.map(toDay),
    totals: {
      minutes: sumMinutes(plays),
      episodes: countEpisodes(plays),
      movies: countMovies(plays),
    },
    genres: toGenres(plays),
  };
}
