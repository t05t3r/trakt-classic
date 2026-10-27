import { describe, expect, it } from 'vitest';
import { withSize } from './withSize.ts';

const poster = (size: string) =>
  `https://media.trakt.tv/images/movies/000/012/601/posters/${size}/a.jpg.webp`;

describe('withSize', () => {
  describe('targets', () => {
    it('should rewrite a candidate to thumb', () => {
      expect(withSize({ url: poster('original'), size: 'thumb' }))
        .toBe(poster('thumb'));
    });

    it('should rewrite a candidate to medium', () => {
      expect(withSize({ url: poster('original'), size: 'medium' }))
        .toBe(poster('medium'));
    });

    it('should rewrite a candidate to full', () => {
      expect(withSize({ url: poster('original'), size: 'full' }))
        .toBe(poster('full'));
    });
  });

  describe('sources', () => {
    it('should rewrite from thumb', () => {
      expect(withSize({ url: poster('thumb'), size: 'full' }))
        .toBe(poster('full'));
    });

    it('should rewrite from medium', () => {
      expect(withSize({ url: poster('medium'), size: 'full' }))
        .toBe(poster('full'));
    });

    it('should rewrite from full to thumb', () => {
      expect(withSize({ url: poster('full'), size: 'thumb' }))
        .toBe(poster('thumb'));
    });

    it('should rewrite from full to medium', () => {
      expect(withSize({ url: poster('full'), size: 'medium' }))
        .toBe(poster('medium'));
    });

    it('should rewrite from original', () => {
      expect(withSize({ url: poster('original'), size: 'medium' }))
        .toBe(poster('medium'));
    });
  });

  it('should not mistake an art type that prefixes a size name for the size', () => {
    const thumbs = (size: string) =>
      `https://media.trakt.tv/images/shows/000/001/002/thumbs/${size}/abc.jpg.webp`;

    expect(withSize({ url: thumbs('medium'), size: 'full' }))
      .toBe(thumbs('full'));
  });

  it('should leave an avatar path untouched', () => {
    const avatar =
      'https://media.trakt.tv/images/users/015/331/014/avatars/large/83f8741ac7.jpg';

    expect(withSize({ url: avatar, size: 'thumb' })).toBe(avatar);
  });

  it('should return a URL with no known size segment verbatim', () => {
    const url = 'https://example.com/pictures/a.jpg';

    expect(withSize({ url, size: 'full' })).toBe(url);
  });
});
