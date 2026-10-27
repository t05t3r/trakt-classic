import { z } from 'zod';

export const LandingErrorSchema = z.enum([
  'denied',
  'state',
  'exchange',
  'rate_limited',
  'expired',
]);

export type LandingError = z.infer<typeof LandingErrorSchema>;
