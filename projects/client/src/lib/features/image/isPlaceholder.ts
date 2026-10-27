import { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';
import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';

const PLACEHOLDER_URLS: ReadonlySet<ImageUrl> = new Set(
  Object.values(PLACEHOLDERS),
);

export function isPlaceholder(url: ImageUrl): boolean {
  return PLACEHOLDER_URLS.has(url);
}
