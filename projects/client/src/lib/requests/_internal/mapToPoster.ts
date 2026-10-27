import { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';
import { findDefined } from '$lib/utils/string/findDefined.ts';
import type { MediaEntry } from '../models/MediaEntry.ts';
import { mapToImage } from './mapToImage.ts';

type Images = {
  poster?: string[];
};

export function mapToPoster(
  images: Images | Nil,
): MediaEntry['poster'] {
  const posterCandidate = findDefined(
    ...(images?.poster ?? []),
  );

  return {
    url: mapToImage({
      candidate: posterCandidate,
      placeholder: PLACEHOLDERS.poster,
    }),
  };
}
