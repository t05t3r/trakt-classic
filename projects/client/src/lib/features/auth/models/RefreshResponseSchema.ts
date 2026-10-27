import { z } from 'zod';

export const RefreshResponseSchema = z.object({
  token: z.string().min(1),
});
