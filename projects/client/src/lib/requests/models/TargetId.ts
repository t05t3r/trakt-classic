import { z } from 'zod';
import { TargetMediaTypeSchema } from './TargetMediaType.ts';

export const TargetIdSchema = z.object({
  type: TargetMediaTypeSchema,
  id: z.number(),
});
export type TargetId = z.infer<typeof TargetIdSchema>;
