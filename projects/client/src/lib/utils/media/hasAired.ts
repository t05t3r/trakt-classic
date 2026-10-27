import { type EpisodeType } from '$lib/requests/models/EpisodeType.ts';
import type { MediaStatus } from '$lib/requests/models/MediaStatus.ts';
import type { TargetMediaType } from '$lib/requests/models/TargetMediaType.ts';
import { time } from '$lib/utils/timing/time.ts';

type HasAiredProps = {
  type: TargetMediaType | EpisodeType;
  effectiveReleaseDate: Date;
  status?: MediaStatus;
};

// Timezone and scheduling skew: an episode or a season counts as aired up to a day early.
const AIR_BUFFER = time.hours(24);

export function hasAired(props: HasAiredProps): boolean {
  const buffer = props.type === 'episode' || props.type === 'season'
    ? AIR_BUFFER
    : 0;
  const isAvailable =
    props.effectiveReleaseDate.getTime() - buffer <= Date.now();

  if (props.type === 'movie' && Boolean(props.status)) {
    return props.status === 'released' || isAvailable;
  }

  return isAvailable;
}
