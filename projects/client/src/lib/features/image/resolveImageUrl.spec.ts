import { describe, expect, it } from 'vitest';
import { resolveImageUrl } from './resolveImageUrl.ts';

describe('resolveImageUrl', () => {
  it('should proxy a scheme-less Trakt image URL', () => {
    expect(
      resolveImageUrl(
        'media.trakt.tv/images/shows/000/180/770/logos/medium/b0c9a10541.png.webp',
      ),
    ).toBe('/img/shows/000/180/770/logos/medium/b0c9a10541.png.webp');
  });

  describe('for Gravatar URLs', () => {
    it("should ask for a 404 instead of Trakt's placeholder", () => {
      expect(
        resolveImageUrl(
          'https://secure.gravatar.com/avatar/abc?d=https%3A%2F%2Fmedia.trakt.tv%2Fhotlink-ok%2Fplaceholders%2Fmedium%2Fzoidberg.png&r=pg&s=256',
        ),
      ).toBe('https://secure.gravatar.com/avatar/abc?d=404&r=pg&s=256');
    });

    it('should ask for a 404 when the URL names no fallback', () => {
      expect(resolveImageUrl('https://secure.gravatar.com/avatar/abc')).toBe(
        'https://secure.gravatar.com/avatar/abc?d=404',
      );
    });

    it('should keep every other parameter', () => {
      expect(
        resolveImageUrl('https://secure.gravatar.com/avatar/abc?r=pg&s=256'),
      ).toBe('https://secure.gravatar.com/avatar/abc?r=pg&s=256&d=404');
    });
  });

  it('should yield nothing for a missing URL', () => {
    expect(resolveImageUrl(null)).toBeUndefined();
    expect(resolveImageUrl('')).toBeUndefined();
  });

  it('should yield nothing for a host outside Trakt', () => {
    expect(
      resolveImageUrl(
        'assets.fanart.tv/fanart/tv/403245/hdtvlogo/wool-640b57ff556b2.png',
      ),
    ).toBeUndefined();
  });

  it('should yield nothing for a Trakt URL that is not an image path', () => {
    expect(
      resolveImageUrl(
        'media.trakt.tv/images/movies/000/759/944/posters/thumb/../a12a59d031.jpg',
      ),
    ).toBeUndefined();
  });
});
