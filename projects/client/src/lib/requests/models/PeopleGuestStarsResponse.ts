import { castResponseSchema, peopleResponseSchema } from '@trakt/api';
import { z } from 'zod';

// The SDK's people schema has no guest stars, so parsing with it drops them.
export const PeopleGuestStarsResponseSchema = peopleResponseSchema.extend({
  guest_stars: z.array(castResponseSchema).nullish(),
});

export type PeopleGuestStarsResponse = z.infer<
  typeof PeopleGuestStarsResponseSchema
>;
