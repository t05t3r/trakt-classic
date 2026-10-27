import { z } from 'zod';
import { ImageUrlSchema } from './ImageUrlSchema.ts';

export const ImageUrlsSchema = z.object({
  medium: ImageUrlSchema,
  thumb: ImageUrlSchema,
  full: ImageUrlSchema,
});

export type ImageUrls = z.infer<typeof ImageUrlsSchema>;
