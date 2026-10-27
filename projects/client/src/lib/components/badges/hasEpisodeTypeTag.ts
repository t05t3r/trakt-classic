import type { EpisodeType } from '$lib/requests/models/EpisodeType.ts';
import { EPISODE_TYPE_TEXT } from './_internal/EPISODE_TYPE_TEXT.ts';

export function hasEpisodeTypeTag(type: EpisodeType): boolean {
  return EPISODE_TYPE_TEXT[type] !== undefined;
}
