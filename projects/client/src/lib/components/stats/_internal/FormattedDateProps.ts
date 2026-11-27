import type { DatePattern } from '$lib/utils/formatting/date/toHumanPatternDate.ts';

export type FormattedDateProps =
  & {
    date: Date;
    pattern: DatePattern;
  }
  & (
    | {
      swap?: true;
      // A tooltip's trigger props, which only the toggle can take.
      triggerProps?: Record<string, unknown>;
    }
    | { swap: false; triggerProps?: never }
  );
