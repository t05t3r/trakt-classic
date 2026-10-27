import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { mapToEpisodeEntry } from '$lib/requests/_internal/mapToEpisodeEntry.ts';
import { mapToMovieEntry } from '$lib/requests/_internal/mapToMovieEntry.ts';
import { mapToShowEntry } from '$lib/requests/_internal/mapToShowEntry.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import {
  type CalendarEntry,
  CalendarEntrySchema,
} from '$lib/requests/models/CalendarEntry.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { isValidDate } from '$lib/utils/date/isValidDate.ts';
import { time } from '$lib/utils/timing/time.ts';
import type { HotReleaseResponse } from '@trakt/api';
import { z } from 'zod';

type CalendarTab =
  | 'shows-movies'
  | 'shows'
  | 'premieres'
  | 'new-shows'
  | 'finales'
  | 'movies'
  | 'streaming'
  | 'dvd';

type CalendarParams =
  & {
    target: 'my' | 'all';
    tab: Extract<CalendarTab, 'shows-movies'>;
    startDate: string;
    days: number;
  }
  & ApiParams;

const CalendarDateSchema = z.string().date();

function mapToCalendarMovie(row: HotReleaseResponse): CalendarEntry | null {
  if (row.movie == null) return null;

  const released = CalendarDateSchema.safeParse(row.released);
  if (!released.success) return null;

  return {
    kind: 'movie',
    movie: mapToMovieEntry(row.movie),
    releasedOn: released.data,
  };
}

function mapToCalendarEpisode(row: HotReleaseResponse): CalendarEntry | null {
  const { episode, show } = row;
  if (episode == null || show == null) return null;

  const firstAired = row.first_aired ?? episode.first_aired;
  if (firstAired == null) return null;

  const airsAt = new Date(firstAired);
  if (!isValidDate(airsAt)) return null;

  return {
    kind: 'episode',
    show: mapToShowEntry(show),
    episode: mapToEpisodeEntry(episode),
    ...(episode.episodes
      ? { episodes: episode.episodes.map(mapToEpisodeEntry) }
      : {}),
    airsAt,
  };
}

function mapToCalendarEntries(row: HotReleaseResponse): CalendarEntry[] {
  const entry = row.movie != null
    ? mapToCalendarMovie(row)
    : mapToCalendarEpisode(row);

  return entry ? [entry] : [];
}

const calendarRequest = (
  { fetch, target, startDate, days }: CalendarParams,
) =>
  api({ fetch })
    .calendars
    .media({
      query: {
        extended: 'full,images',
        group: 'day',
      },
      params: {
        target,
        start_date: startDate,
        days,
      },
    });

export const calendarQuery = defineQuery({
  key: 'calendar',
  invalidations: [
    InvalidateAction.Watchlisted('show'),
    InvalidateAction.Watchlisted('movie'),
    InvalidateAction.Watchlisted('season'),
    InvalidateAction.Watchlisted('episode'),
    InvalidateAction.MarkAsWatched('episode'),
    InvalidateAction.MarkAsWatched('show'),
    InvalidateAction.MarkAsWatched('movie'),
    InvalidateAction.Drop('show'),
    InvalidateAction.Restore,
  ],
  dependencies: (params: CalendarParams) => [
    params.target,
    params.tab,
    params.startDate,
    params.days,
  ],
  request: calendarRequest,
  mapper: (response) => response.body.flatMap(mapToCalendarEntries),
  schema: CalendarEntrySchema.array(),
  ttl: time.minutes(30),
});
