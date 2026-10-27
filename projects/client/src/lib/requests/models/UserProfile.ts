import { UserNameSchema } from '$lib/requests/models/UserName.ts';
import { ImageUrlSchema } from '$lib/requests/models/ImageUrlSchema.ts';
import z from 'zod';

export const UserProfileSchema = z.object({
  id: z.number(),
  key: z.string(),
  username: z.string(),
  name: UserNameSchema,
  private: z.boolean(),
  isVip: z.boolean(),
  isDirector: z.boolean(),
  isDeleted: z.boolean(),
  slug: z.string().nullish(),
  avatar: z.object({
    url: ImageUrlSchema,
  }),
  location: z.string().nullish(),
  about: z.string().nullish(),
  joinedAt: z.date().nullish(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
