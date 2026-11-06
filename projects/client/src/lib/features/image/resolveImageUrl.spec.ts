import { AVATAR_PATH } from '$mocks/data/images/AVATAR_PATH.ts';
import { MOVIE_ART_PATH } from '$mocks/data/images/MOVIE_ART_PATH.ts';
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

  describe('for the versioned avatar form', () => {
    it('should proxy it with its scheme', () => {
      expect(resolveImageUrl(`https://media.trakt.tv/${AVATAR_PATH}`)).toBe(
        `/img/${AVATAR_PATH}`,
      );
    });

    it('should proxy it without a scheme', () => {
      expect(resolveImageUrl(`media.trakt.tv/${AVATAR_PATH}`)).toBe(
        `/img/${AVATAR_PATH}`,
      );
    });

    it.each([
      [
        'under images/',
        'media.trakt.tv/images/users/1/avatar.webp?v=1754435517',
      ],
      [
        'an art path at the root',
        'media.trakt.tv/movies/000/012/601/posters/thumb/e0d9dd35c5.jpg.webp',
      ],
      [
        'the seven-segment form at the root',
        'media.trakt.tv/users/015/331/014/avatars/large/83f8741ac7.jpg',
      ],
      ['no version', 'media.trakt.tv/users/1/avatar.webp'],
      ['another host', 'walter-r2.trakt.tv/users/1/avatar.webp?v=1754435517'],
      [
        "Trakt's own avatar",
        'https://app.trakt.tv/email/brand/mark-violet-disc.svg',
      ],
    ])('should yield nothing for %s', (_, url) => {
      expect(resolveImageUrl(url)).toBeUndefined();
    });
  });

  describe('for the movie art form', () => {
    it('should proxy it with its scheme', () => {
      expect(resolveImageUrl(`https://media.trakt.tv/${MOVIE_ART_PATH}`)).toBe(
        `/img/${MOVIE_ART_PATH}`,
      );
    });

    it('should proxy it without a scheme', () => {
      expect(resolveImageUrl(`media.trakt.tv/${MOVIE_ART_PATH}`)).toBe(
        `/img/${MOVIE_ART_PATH}`,
      );
    });

    it.each([
      ['under images/', `media.trakt.tv/images/${MOVIE_ART_PATH}`],
      ['another Trakt host', `walter-r2.trakt.tv/${MOVIE_ART_PATH}`],
      [
        'another Trakt host under images/',
        `walter.trakt.tv/images/${MOVIE_ART_PATH}`,
      ],
      ['a host outside Trakt', `example.com/${MOVIE_ART_PATH}`],
      ['a look-alike host', `media.trakt.tv.example.com/${MOVIE_ART_PATH}`],
      ['a host ending in the media host', `xmedia.trakt.tv/${MOVIE_ART_PATH}`],
      [
        'the media host as a path',
        `example.com/media.trakt.tv/${MOVIE_ART_PATH}`,
      ],
      ['a query string', `media.trakt.tv/${MOVIE_ART_PATH}?v=1754435517`],
      ['a leading-zero id', 'media.trakt.tv/movies/012808/medium/poster.webp'],
      [
        'an unknown art name',
        'media.trakt.tv/movies/12808/medium/character.webp',
      ],
    ])('should yield nothing for %s', (_, url) => {
      expect(resolveImageUrl(url)).toBeUndefined();
    });
  });

  describe('for the other kinds at the root', () => {
    it.each([
      'shows/180770/medium/thumb.webp',
      'seasons/257490/medium/poster.webp',
      'episodes/5165667/medium/screenshot.webp',
      'people/415018/medium/headshot.webp',
    ])('should proxy %s', (path) => {
      expect(resolveImageUrl(`https://media.trakt.tv/${path}`)).toBe(
        `/img/${path}`,
      );
      expect(resolveImageUrl(`media.trakt.tv/${path}`)).toBe(`/img/${path}`);
    });

    it.each([
      [
        'under images/',
        'media.trakt.tv/images/shows/180770/medium/poster.webp',
      ],
      ['another host', 'walter.trakt.tv/shows/180770/medium/poster.webp'],
      ['an unknown kind', 'media.trakt.tv/lists/1/medium/poster.webp'],
      [
        'a nested path',
        'media.trakt.tv/shows/180770/seasons/1/medium/poster.webp',
      ],
      ['a leading zero', 'media.trakt.tv/shows/0180770/medium/poster.webp'],
      ['the large size', 'media.trakt.tv/shows/180770/large/poster.webp'],
      ['the banner art', 'media.trakt.tv/shows/180770/medium/banner.webp'],
    ])('should yield nothing for %s', (_, url) => {
      expect(resolveImageUrl(url)).toBeUndefined();
    });
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
