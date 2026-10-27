import { z } from 'zod';
import { ImageUrlSchema } from './ImageUrlSchema.ts';

export const LogoUrlsSchema = z.object({
  medium: ImageUrlSchema,
  full: ImageUrlSchema,
});

export type LogoUrls = z.infer<typeof LogoUrlsSchema>;
