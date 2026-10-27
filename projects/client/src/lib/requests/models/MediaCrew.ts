import { z } from 'zod';
import { ImageUrlsSchema } from './ImageUrlsSchema.ts';

const baseSchema = z.object({
  name: z.string(),
  key: z.string(),
  episodeCount: z.number().optional(),
});

const CrewMemberSchema = baseSchema.extend({
  jobs: z.array(z.string()),
});
export type CrewMember = z.infer<typeof CrewMemberSchema>;

const CastMemberSchema = baseSchema.extend({
  characterName: z.string(),
  characters: z.array(z.string()).optional(),
  headshot: z.object({
    url: ImageUrlsSchema,
  }),
});
export type CastMember = z.infer<typeof CastMemberSchema>;

export const MediaCrewSchema = z.object({
  directors: z.array(CrewMemberSchema),
  writers: z.array(CrewMemberSchema),
  creators: z.array(CrewMemberSchema),
  cast: z.array(CastMemberSchema),
  guestStars: z.array(CastMemberSchema),
});
export type MediaCrew = z.infer<typeof MediaCrewSchema>;
