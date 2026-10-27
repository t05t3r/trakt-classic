import { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';
import { findDefined } from '$lib/utils/string/findDefined.ts';
import type { PersonResponse } from '@trakt/api';
import type { PersonSummary } from '../models/PersonSummary.ts';
import { mapToImage } from './mapToImage.ts';

export function mapToHeadshot(
  images: PersonResponse['images'],
): PersonSummary['headshot'] {
  const headshotCandidate = findDefined(...(images?.headshot ?? []));

  return {
    url: mapToImage({
      candidate: headshotCandidate,
      placeholder: PLACEHOLDERS.poster,
    }),
  };
}
