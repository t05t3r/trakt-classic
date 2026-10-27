import { describe, expect, it } from 'vitest';
import { mapToLogo } from './mapToLogo.ts';

const imagesWithLogo = (logo: string[]) => ({
  fanart: [],
  poster: [],
  logo,
  clearart: [],
  banner: [],
  thumb: [],
});

describe('mapToLogo', () => {
  it('should map a logo published at full into medium and full', () => {
    const result = mapToLogo(imagesWithLogo([
      'media.trakt.tv/images/shows/000/180/770/logos/full/b0c9a10541.png.webp',
    ]));

    expect(result).toEqual({
      url: {
        medium: '/img/shows/000/180/770/logos/medium/b0c9a10541.png.webp',
        full: '/img/shows/000/180/770/logos/full/b0c9a10541.png.webp',
      },
    });
  });

  it('should yield nothing when no candidate resolves to a Trakt image', () => {
    const result = mapToLogo(imagesWithLogo([
      'assets.fanart.tv/fanart/tv/403245/hdtvlogo/wool-640b57ff556b2.png',
    ]));

    expect(result).toBeUndefined();
  });
});
