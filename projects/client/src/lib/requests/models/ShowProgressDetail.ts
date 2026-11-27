import { z } from 'zod';
import { EpisodeEntrySchema } from './EpisodeEntry.ts';
import { SeasonSchema } from './Season.ts';

const EpisodeProgressSchema = z.object({
  number: z.number(),
  completed: z.boolean(),
  lastWatchedAt: z.date().nullable(),
});

const SeasonProgressSchema = z.object({
  number: z.number(),
  title: z.string().nullable(),
  total: z.number(),
  completed: z.number(),
  lastWatchedAt: z.date().nullable(),
  episodes: EpisodeProgressSchema.array(),
  plays: z.number(),
  minutesWatched: z.number(),
  minutesLeft: z.number(),
});

const SeasonRefSchema = SeasonSchema.pick({ id: true, number: true });

export const ShowProgressDetailSchema = z.object({
  total: z.number(),
  completed: z.number(),
  lastWatchedAt: z.date().nullable(),
  nextEpisode: EpisodeEntrySchema.nullable(),
  seasons: SeasonProgressSchema.array(),
  hiddenSeasons: SeasonRefSchema.array(),
});

export type EpisodeProgress = z.infer<typeof EpisodeProgressSchema>;
export type SeasonProgress = z.infer<typeof SeasonProgressSchema>;
export type SeasonRef = z.infer<typeof SeasonRefSchema>;
export type ShowProgressDetail = z.infer<typeof ShowProgressDetailSchema>;
