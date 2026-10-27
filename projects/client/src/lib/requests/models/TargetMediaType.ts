import { z } from 'zod';

export const TargetMediaTypeSchema = z.enum([
  'movie',
  'show',
  'season',
  'episode',
]);
export type TargetMediaType = z.infer<typeof TargetMediaTypeSchema>;
