import { z } from 'zod';

export const ImageUrlSchema = z.string().regex(
  /^(\/(?!\/)|https:\/\/secure\.gravatar\.com\/)/,
);

export type ImageUrl = z.infer<typeof ImageUrlSchema>;
