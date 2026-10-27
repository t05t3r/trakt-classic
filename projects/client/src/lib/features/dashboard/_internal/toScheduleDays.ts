import { bucketByLocalDate } from '$lib/features/calendar/bucketByLocalDate.ts';
import type { CalendarEntry } from '$lib/requests/models/CalendarEntry.ts';
import type { ScheduleDay } from '$lib/features/dashboard/models/ScheduleDay.ts';
import { toLineKey } from '$lib/features/dashboard/toLineKey.ts';
import { dedupe } from '$lib/utils/array/dedupe.ts';
import { formatLocalDate } from '$lib/utils/date/formatLocalDate.ts';

type ToScheduleDaysParams = {
  entries: ReadonlyArray<CalendarEntry>;
  today: Date;
  start: Date;
  days: number;
};

const SHOWN_DAYS = 5;

// A run's episodes air together, so each line keeps the row's air time.
function toLines(entry: CalendarEntry): ReadonlyArray<CalendarEntry> {
  if (entry.kind === 'movie') return [entry];

  const { show, episode, episodes, airsAt } = entry;
  const run = episodes?.length ? episodes : [episode];

  return run.map((line) => ({ kind: 'episode', show, episode: line, airsAt }));
}

function idOf(line: CalendarEntry): number {
  return line.kind === 'episode' ? line.show.id : line.movie.id;
}

// The bucket's stable sort keeps this order among the lines it ranks equal.
function byId(a: CalendarEntry, b: CalendarEntry): number {
  return idOf(a) - idOf(b);
}

export function toScheduleDays(
  { entries, today, start, days }: ToScheduleDaysParams,
): ReadonlyArray<ScheduleDay> {
  const todayKey = formatLocalDate(today);
  const windowDays = bucketByLocalDate({
    entries: entries.flatMap(toLines).toSorted(byId),
    start,
    days,
  });

  return windowDays
    .filter(({ key, items }) => key >= todayKey && items.length > 0)
    .slice(0, SHOWN_DAYS)
    .map((day) => ({ ...day, items: dedupe(toLineKey, day.items) }));
}
