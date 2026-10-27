import type {
  CastGroup,
  CastGroupKey,
} from '$lib/features/summary/_internal/CastGroup.ts';
import type { MediaCrew } from '$lib/requests/models/MediaCrew.ts';

type RegularsKey = Extract<CastGroupKey, 'regulars' | 'seasonRegulars'>;

export function toRegularsGroups(regularsKey: RegularsKey) {
  return (
    { cast, guestStars }: Pick<MediaCrew, 'cast' | 'guestStars'>,
  ): ReadonlyArray<CastGroup> => [
    { key: regularsKey, members: cast },
    { key: 'guest', members: guestStars },
  ];
}
