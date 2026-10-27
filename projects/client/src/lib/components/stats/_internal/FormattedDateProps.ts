import type { DatePattern } from '$lib/utils/formatting/date/toHumanPatternDate.ts';

export type FormattedDateProps = {
  date: Date;
  pattern: DatePattern;
  swap?: boolean;
};
