import type { ChartDay } from '$lib/components/stats/DailyMinutesChartProps.ts';
import type { GenreBar } from '$lib/components/stats/GenreBarsProps.ts';
import type {
  GenreShare,
  Last30Day,
  Last30Days,
} from '$lib/features/dashboard/models/Last30Days.ts';
import { subtractDays } from '$lib/utils/date/subtractDays.ts';
import { toTranslatedGenre } from '$lib/utils/formatting/string/toTranslatedGenre.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';

export type Last30DaysCharts = {
  days: ReadonlyArray<ChartDay>;
  genres: ReadonlyArray<GenreBar>;
};

const GENRE_LINK_DAYS = 30;

type Last30DaysChartsParams = {
  data: Last30Days;
};

function toChartDay(
  { key, date, minutes, episodes, movies }: Last30Day,
): ChartDay {
  return {
    key,
    date,
    minutes,
    episodes,
    movies,
    href: UrlBuilder.history.day(date),
  };
}

// Classic's genre links start at the UTC date of 30 local days back, not the window's start.
function toGenreLinkStart(now: Date): string {
  return subtractDays(now, GENRE_LINK_DAYS).toISOString().slice(0, 10);
}

const toGenreBar =
  (startAt: string) =>
  ({ slug, share, episodes, shows, movies }: GenreShare): GenreBar => {
    const historyOf = (type: 'episodes' | 'shows' | 'movies') =>
      UrlBuilder.history.genre({ type, genre: slug, startAt });

    return {
      key: slug,
      name: toTranslatedGenre(slug),
      share,
      episodes: { ...episodes, href: historyOf('episodes') },
      shows: { distinct: shows, href: historyOf('shows') },
      movies: { ...movies, href: historyOf('movies') },
    };
  };

export function toLast30DaysCharts(
  { data }: Last30DaysChartsParams,
): Last30DaysCharts {
  return {
    days: data.days.map(toChartDay),
    genres: data.genres.map(toGenreBar(toGenreLinkStart(data.now))),
  };
}
