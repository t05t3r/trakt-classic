import { genreOptionSchema } from '@trakt/api';
import { z } from 'zod';
import { EpisodeTypeSchema } from './EpisodeType.ts';
import { ImageUrlsSchema } from './ImageUrlsSchema.ts';
import { PostCreditsSchema } from './PostCreditsSchema.ts';

export const EpisodeEntrySchema = z.object({
  id: z.number(),
  imdbId: z.string().nullish(),
  key: z.string(),
  season: z.number(),
  number: z.number(),
  title: z.string(),
  overview: z.string(),
  cover: z.object({
    url: ImageUrlsSchema,
  }),
  genres: genreOptionSchema.array(),
  airDate: z.date(),
  releaseDate: z.date(),
  effectiveReleaseDate: z.date(),
  type: EpisodeTypeSchema,
  runtime: z.number(),
  year: z.number(),
  certification: z.null().optional(),
  postCredits: PostCreditsSchema.array(),
  rating: z.number().nullish(),
  votes: z.number().nullish(),
  updatedAt: z.date().nullish(),
});

export type EpisodeEntry = z.infer<typeof EpisodeEntrySchema>;
