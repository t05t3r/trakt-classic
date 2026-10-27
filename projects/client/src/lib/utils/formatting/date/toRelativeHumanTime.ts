import * as m from '$lib/features/i18n/messages.ts';
import type { Locale } from '$lib/paraglide/runtime.js';
import { time } from '$lib/utils/timing/time.ts';

type ToRelativeHumanTimeProps = {
  date: Date;
  now: Date;
};

type Direction = 'past' | 'future';
type Unit = 'minutes' | 'hours' | 'days' | 'months' | 'years';

type MessageOptions = { locale: Locale };
type Message = (
  inputs: Record<string, never>,
  options: MessageOptions,
) => string;

type PluralMessages = {
  one: Message;
  other: (inputs: { count: number }, options: MessageOptions) => string;
};

// 400 Gregorian years hold 146097 days, 4800 months.
const DAYS_PER_MONTH = 146097 / 4800;
const DAYS_PER_YEAR = 146097 / 400;

// Classic's relative dates are moment.js's: each unit applies while its
// rounded count stays under the limit.
const SECONDS_LIMIT = 45;
const UNIT_LIMITS: ReadonlyArray<readonly [Unit, number]> = [
  ['minutes', 45],
  ['hours', 22],
  ['days', 26],
  ['months', 11],
];

const SECONDS_MESSAGES: Readonly<Record<Direction, Message>> = {
  past: m.text_relative_time_past_seconds,
  future: m.text_relative_time_future_seconds,
};

const UNIT_MESSAGES: Readonly<
  Record<Direction, Readonly<Record<Unit, PluralMessages>>>
> = {
  past: {
    minutes: {
      one: m.text_relative_time_past_minutes_one,
      other: m.text_relative_time_past_minutes_other,
    },
    hours: {
      one: m.text_relative_time_past_hours_one,
      other: m.text_relative_time_past_hours_other,
    },
    days: {
      one: m.text_relative_time_past_days_one,
      other: m.text_relative_time_past_days_other,
    },
    months: {
      one: m.text_relative_time_past_months_one,
      other: m.text_relative_time_past_months_other,
    },
    years: {
      one: m.text_relative_time_past_years_one,
      other: m.text_relative_time_past_years_other,
    },
  },
  future: {
    minutes: {
      one: m.text_relative_time_future_minutes_one,
      other: m.text_relative_time_future_minutes_other,
    },
    hours: {
      one: m.text_relative_time_future_hours_one,
      other: m.text_relative_time_future_hours_other,
    },
    days: {
      one: m.text_relative_time_future_days_one,
      other: m.text_relative_time_future_days_other,
    },
    months: {
      one: m.text_relative_time_future_months_one,
      other: m.text_relative_time_future_months_other,
    },
    years: {
      one: m.text_relative_time_future_years_one,
      other: m.text_relative_time_future_years_other,
    },
  },
};

function toRoundedUnits(distance: number): Readonly<Record<Unit, number>> {
  const days = distance / time.days(1);

  return {
    minutes: Math.round(distance / time.minutes(1)),
    hours: Math.round(distance / time.hours(1)),
    days: Math.round(days),
    months: Math.round(days / DAYS_PER_MONTH),
    years: Math.round(days / DAYS_PER_YEAR),
  };
}

export function toRelativeHumanTime(
  { date, now }: ToRelativeHumanTimeProps,
  locale: Locale = 'en',
): string {
  const offset = date.getTime() - now.getTime();
  if (Number.isNaN(offset)) return '';

  const direction: Direction = offset > 0 ? 'future' : 'past';
  const distance = Math.abs(offset);

  if (Math.round(distance / time.seconds(1)) < SECONDS_LIMIT) {
    return SECONDS_MESSAGES[direction]({}, { locale });
  }

  const counts = toRoundedUnits(distance);
  const [unit] =
    UNIT_LIMITS.find(([candidate, limit]) => counts[candidate] < limit) ??
      ['years'];
  const count = counts[unit];
  const messages = UNIT_MESSAGES[direction][unit];

  return count <= 1
    ? messages.one({}, { locale })
    : messages.other({ count }, { locale });
}
