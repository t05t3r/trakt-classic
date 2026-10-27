import type { EpisodeType } from '$lib/requests/models/EpisodeType.ts';
import { describe, expect, it } from 'vitest';
import { hasEpisodeTypeTag } from './hasEpisodeTypeTag.ts';

describe('util: hasEpisodeTypeTag', () => {
  it.each<EpisodeType>([
    'series_premiere',
    'season_premiere',
    'mid_season_premiere',
    'mid_season_finale',
    'season_finale',
    'series_finale',
  ])('should give a %s a tag', (type) => {
    expect(hasEpisodeTypeTag(type)).toBe(true);
  });

  it.each<EpisodeType>([
    'standard',
    'unknown',
    'full_season',
    'multiple_episodes',
  ])('should give a %s no tag', (type) => {
    expect(hasEpisodeTypeTag(type)).toBe(false);
  });
});
