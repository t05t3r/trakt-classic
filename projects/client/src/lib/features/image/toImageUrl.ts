import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import { resolveImageUrl } from './resolveImageUrl.ts';

type ToImageUrlParams = {
  url: string | Nil;
  placeholder: ImageUrl;
};

export function toImageUrl({ url, placeholder }: ToImageUrlParams): ImageUrl {
  return resolveImageUrl(url) ?? placeholder;
}
