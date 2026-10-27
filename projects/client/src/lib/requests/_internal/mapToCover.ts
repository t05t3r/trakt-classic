import { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';
import { findDefined } from '$lib/utils/string/findDefined.ts';
import type { MovieResponse, ShowResponse } from '@trakt/api';
import type { MediaEntry } from '../models/MediaEntry.ts';
import { mapToImage } from './mapToImage.ts';

export function mapToCover(
  images: ShowResponse['images'] | MovieResponse['images'],
): MediaEntry['cover'] {
  const coverCandidate = findDefined(...(images?.fanart ?? []));

  return {
    url: mapToImage({
      candidate: coverCandidate,
      placeholder: PLACEHOLDERS.fanart,
    }),
  };
}
