import { z } from 'zod';
import { EpisodeEntrySchema } from './EpisodeEntry.ts';

const SeasonProgressSchema = z.object({
  number: z.number(),
  total: z.number(),
  completed: z.number(),
  lastWatchedAt: z.date().nullable(),
});

export const ShowProgressDetailSchema = z.object({
  total: z.number(),
  completed: z.number(),
  lastWatchedAt: z.date().nullable(),
  nextEpisode: EpisodeEntrySchema.nullable(),
  seasons: SeasonProgressSchema.array(),
});

export type SeasonProgress = z.infer<typeof SeasonProgressSchema>;
export type ShowProgressDetail = z.infer<typeof ShowProgressDetailSchema>;
