import { toImageUrl } from '$lib/features/image/toImageUrl.ts';
import { withSize } from '$lib/features/image/withSize.ts';
import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import type { ImageUrls } from '$lib/requests/models/ImageUrlsSchema.ts';

type MapToImageParams = {
  candidate: string | Nil;
  placeholder: ImageUrl;
};

export function mapToImage(
  { candidate, placeholder }: MapToImageParams,
): ImageUrls {
  if (candidate == null) {
    return { medium: placeholder, thumb: placeholder, full: placeholder };
  }

  return {
    medium: toImageUrl({
      url: withSize({ url: candidate, size: 'medium' }),
      placeholder,
    }),
    thumb: toImageUrl({
      url: withSize({ url: candidate, size: 'thumb' }),
      placeholder,
    }),
    full: toImageUrl({
      url: withSize({ url: candidate, size: 'full' }),
      placeholder,
    }),
  };
}
