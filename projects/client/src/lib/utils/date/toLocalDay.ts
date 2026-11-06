import { formatLocalDate } from '$lib/utils/date/formatLocalDate.ts';

export type LocalDay = {
  key: string;
  date: Date;
};

export function toLocalDay(date: Date): LocalDay {
  return { key: formatLocalDate(date), date };
}
