import { z } from 'zod';
import { EpisodeEntrySchema } from './EpisodeEntry.ts';
import { MovieEntrySchema } from './MovieEntry.ts';
import { ShowEntrySchema } from './ShowEntry.ts';

const CalendarEpisodeEntrySchema = z.object({
  kind: z.literal('episode'),
  show: ShowEntrySchema,
  episode: EpisodeEntrySchema,
  episodes: EpisodeEntrySchema.array().optional(),
  airsAt: z.date(),
});

const CalendarMovieEntrySchema = z.object({
  kind: z.literal('movie'),
  movie: MovieEntrySchema,
  releasedOn: z.string(),
});

export const CalendarEntrySchema = z.discriminatedUnion('kind', [
  CalendarEpisodeEntrySchema,
  CalendarMovieEntrySchema,
]);

export type CalendarEntry = z.infer<typeof CalendarEntrySchema>;
