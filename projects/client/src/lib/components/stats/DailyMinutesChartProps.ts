import type { Pathname } from '$app/types';
import type { Count } from '$lib/utils/formatting/number/countText.ts';

export type ChartDay = {
  key: string;
  date: Date;
  minutes: number;
  episodes: Count;
  movies: Count;
  href: Pathname;
};

export type DailyMinutesChartProps = {
  days: ReadonlyArray<ChartDay>;
};
