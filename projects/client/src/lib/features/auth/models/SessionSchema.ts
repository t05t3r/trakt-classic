import { z } from 'zod';

export const SessionSchema = z.object({
  access: z.string().min(1),
  refresh: z.string().min(1),
  expiresAt: z.number().finite(),
});
