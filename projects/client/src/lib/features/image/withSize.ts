import { type ImageSize, MEDIA_ART_SIZES } from './imageSizes.ts';

type WithSizeParams = {
  url: string;
  size: ImageSize;
};

const sizeSegmentPattern = new RegExp(`/(?:${MEDIA_ART_SIZES.join('|')})/`);

export function withSize({ url, size }: WithSizeParams): string {
  return url.replace(sizeSegmentPattern, `/${size}/`);
}
