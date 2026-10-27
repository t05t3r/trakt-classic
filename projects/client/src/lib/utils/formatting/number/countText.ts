import * as m from '$lib/features/i18n/messages.ts';
import type { Locale } from '$lib/paraglide/runtime.js';
import { toGroupedNumber } from './toGroupedNumber.ts';

export type CountUnit =
  | 'episodes'
  | 'shows'
  | 'movies'
  | 'plays'
  | 'seasons'
  | 'episodesTitle'
  | 'comments';

export type Count = { distinct: number; plays: number };

// Spelled reads '(70 plays)'; bare reads Classic's genre bar '(70)'.
export type PlaysForm = 'spelled' | 'bare';

export type CountWithPlays = {
  count: string;
  figure: string;
  word: string;
  plays: { count: number; text: string } | undefined;
  text: string;
};

type MessageOptions = { locale: Locale };
type UnitWord = (
  inputs: Record<string, never>,
  options: MessageOptions,
) => string;
type UnitWords = { one: UnitWord; other: UnitWord };

type WordParams = { count: number | undefined; unit: CountUnit };
type OfParams = { count: number; unit: CountUnit };
type WithPlaysParams = {
  count: Pick<Count, 'distinct'> & Partial<Count>;
  unit: CountUnit;
  form: PlaysForm;
};
type CountParts = Pick<CountWithPlays, 'count' | 'figure' | 'word'>;

const UNIT_WORDS: Readonly<Record<CountUnit, UnitWords>> = {
  episodes: {
    one: m.text_dashboard_stats_episodes_one,
    other: m.text_dashboard_stats_episodes_other,
  },
  shows: {
    one: m.text_dashboard_stats_shows_one,
    other: m.text_dashboard_stats_shows_other,
  },
  movies: {
    one: m.text_dashboard_stats_movies_one,
    other: m.text_dashboard_stats_movies_other,
  },
  plays: {
    one: m.text_dashboard_stats_plays_one,
    other: m.text_dashboard_stats_plays_other,
  },
  seasons: {
    one: m.text_seasons_title_one,
    other: m.text_seasons_title_other,
  },
  episodesTitle: {
    one: m.text_episodes_title_one,
    other: m.text_episodes_title_other,
  },
  comments: {
    one: m.text_comments_title_one,
    other: m.text_comments_title,
  },
};

// A count that is not known reads with the plural, as after a dash.
function word({ count, unit }: WordParams, locale: Locale = 'en'): string {
  const words = UNIT_WORDS[unit];

  return count === 1 ? words.one({}, { locale }) : words.other({}, { locale });
}

function partsOf({ count, unit }: OfParams, locale: Locale): CountParts {
  const figure = toGroupedNumber(count, locale);
  const unitWord = word({ count, unit }, locale);

  return {
    count: m.text_stats_count({ count: figure, unit: unitWord }, { locale }),
    figure,
    word: unitWord,
  };
}

function of({ count, unit }: OfParams, locale: Locale = 'en'): string {
  return partsOf({ count, unit }, locale).count;
}

function playsText(
  { count, form }: { count: number; form: PlaysForm },
  locale: Locale,
): string {
  const figure = toGroupedNumber(count, locale);

  return form === 'bare'
    ? m.text_stats_genre_count_plays({ count: figure }, { locale })
    : m.text_stats_count_plays({
      count: figure,
      unit: word({ count, unit: 'plays' }, locale),
    }, { locale });
}

// The plays show only when they are higher than the count.
function withPlays(
  { count: { distinct, plays = 0 }, unit, form }: WithPlaysParams,
  locale: Locale = 'en',
): CountWithPlays {
  const parts = partsOf({ count: distinct, unit }, locale);
  if (plays <= distinct) {
    return { ...parts, plays: undefined, text: parts.count };
  }

  const text = playsText({ count: plays, form }, locale);

  return {
    ...parts,
    plays: { count: plays, text },
    text: m.text_stats_count_with_plays(
      { count: parts.count, plays: text },
      { locale },
    ),
  };
}

export const countText = { word, of, withPlays };
