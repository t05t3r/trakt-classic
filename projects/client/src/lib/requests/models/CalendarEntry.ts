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
  // A `yyyy-MM-dd` the mapper checked with `parseDateOnly`, kept as text: a stored
  // Date would hold one zone's midnight and shift a day in another.
  releasedOn: z.string(),
});

export const CalendarEntrySchema = z.discriminatedUnion('kind', [
  CalendarEpisodeEntrySchema,
  CalendarMovieEntrySchema,
]);

export type CalendarEntry = z.infer<typeof CalendarEntrySchema>;
