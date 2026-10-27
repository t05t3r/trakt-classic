import { findDefined } from '$lib/utils/string/findDefined.ts';
import { resolveImageUrl } from '$lib/features/image/resolveImageUrl.ts';
import { withSize } from '$lib/features/image/withSize.ts';
import type { MovieResponse, ShowResponse } from '@trakt/api';
import type { MediaEntry } from '../models/MediaEntry.ts';

export function mapToLogo(
  images: ShowResponse['images'] | MovieResponse['images'],
): MediaEntry['logo'] {
  const logoCandidate = findDefined(...(images?.logo ?? []));

  if (!logoCandidate) return;

  const medium = resolveImageUrl(
    withSize({ url: logoCandidate, size: 'medium' }),
  );

  if (!medium) return;

  return {
    url: {
      medium,
      full: resolveImageUrl(withSize({ url: logoCandidate, size: 'full' })) ??
        medium,
    },
  };
}
