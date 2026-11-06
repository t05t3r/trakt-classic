import { describe, expect, it } from 'vitest';
import { mapToHeadshot } from './mapToHeadshot.ts';

describe('mapToHeadshot', () => {
  it('should proxy a headshot at the media host at every display size', () => {
    const { url } = mapToHeadshot({
      headshot: ['media.trakt.tv/people/415018/medium/headshot.webp'],
      fanart: [],
    });

    expect(url).toEqual({
      thumb: '/img/people/415018/thumb/headshot.webp',
      medium: '/img/people/415018/medium/headshot.webp',
      full: '/img/people/415018/full/headshot.webp',
    });
  });
});
