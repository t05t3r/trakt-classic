import type { CastMember } from '$lib/requests/models/MediaCrew.ts';

export type CastGroupKey = 'cast' | 'regulars' | 'seasonRegulars' | 'guest';

export type CastGroup = Readonly<{
  key: CastGroupKey;
  members: ReadonlyArray<CastMember>;
}>;
