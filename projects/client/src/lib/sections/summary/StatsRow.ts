import type { Pathname } from '$app/types';

export type StatsValue =
  | { key: string; text: string; href?: Pathname; alt?: string }
  | { key: string; minutes: number; alt?: string };

export type StatsRow = {
  key: string;
  label: string;
  values: ReadonlyArray<StatsValue>;
  // Shown only once hydrated, since its text reads the viewer's time zone.
  zoned?: boolean;
};
