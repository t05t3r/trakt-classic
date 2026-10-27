const DAYS_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};
import { getIntlLocale } from '$lib/features/i18n/getIntlLocale.ts';
import type {
  AvailableLanguage,
  AvailableLocale,
} from '$lib/features/i18n/index.ts';

type ToHumanDayTimeProps = {
  day: string;
  time: string;
  timezone: string;
  locale: AvailableLocale | AvailableLanguage | string;
  now?: Date;
};

/**
 * Returns the most recent Sunday (midnight UTC) relative to the given date.
 * This ensures timezone offset calculations reflect the current DST state.
 */
function recentSunday(now: Date): number {
  const date = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
  date.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return date.getTime();
}

function toZoneFormatter(timeZone: string): Intl.DateTimeFormat | undefined {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    });
  } catch {
    // Intl throws a RangeError for a zone it does not know.
    return undefined;
  }
}

/**
 * Returns the zone's offset from UTC at the moment; its wall clock is read as a
 * full date, since it can fall in another month or year than the moment's.
 */
function toZoneOffsetMs(
  momentMs: number,
  timeZone: string,
): number | undefined {
  const parts = toZoneFormatter(timeZone)?.formatToParts(new Date(momentMs));
  if (!parts) return;

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((entry) => entry.type === type)?.value);
  const wallClockMs = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
  );

  return Number.isFinite(wallClockMs) ? wallClockMs - momentMs : undefined;
}

/**
 * Converts a broadcast day/time/timezone to the user's local day and time.
 *
 * Takes a day name (e.g. "Thursday"), time (e.g. "21:00"), and IANA timezone
 * (e.g. "America/New_York") and returns the equivalent day and formatted time
 * in the user's browser timezone, the day localized to the provided locale and
 * the time as a 24-hour HH:mm.
 */
export function toHumanDayTime(
  { day, time, timezone, locale, now = new Date() }: ToHumanDayTimeProps,
): { day: string; time: string } | undefined {
  const dayIndex = DAYS_INDEX[day];
  if (dayIndex == null) return;

  const [hourStr, minuteStr] = time.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return;

  // Use the most recent Sunday to build a candidate UTC moment for
  // hour:minute on the target day. Using the current week ensures the
  // timezone offset calculation reflects the active DST state.
  const sundayMs = recentSunday(now);
  const refDayMs = sundayMs + dayIndex * 86_400_000;
  const refUtcMs = refDayMs + hour * 3_600_000 + minute * 60_000;

  // The wall time taken as UTC can sit on the other side of a daylight-saving
  // switch from the slot, so the offset is read again at the first estimate.
  const estimateOffsetMs = toZoneOffsetMs(refUtcMs, timezone);
  if (estimateOffsetMs == null) return;

  const offsetMs = toZoneOffsetMs(refUtcMs - estimateOffsetMs, timezone);
  if (offsetMs == null) return;

  const utcDate = new Date(refUtcMs - offsetMs);

  const dayStr = new Intl.DateTimeFormat(
    getIntlLocale(locale as AvailableLanguage),
    { weekday: 'long' },
  )
    .format(utcDate);
  const timeStr = new Intl.DateTimeFormat(
    getIntlLocale(locale as AvailableLanguage),
    {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    },
  ).format(utcDate);

  return { day: dayStr, time: timeStr };
}
