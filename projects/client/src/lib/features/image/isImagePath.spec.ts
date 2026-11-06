import { AVATAR_PATH } from '$mocks/data/images/AVATAR_PATH.ts';
import { MOVIE_ART_PATH } from '$mocks/data/images/MOVIE_ART_PATH.ts';
import { describe, expect, it } from 'vitest';
import { MEDIA_ART_SIZES } from '$lib/features/image/imageSizes.ts';
import { isImagePath } from './isImagePath.ts';

describe('isImagePath', () => {
  it('should accept a Trakt image filename with a bare trailing dot', () => {
    expect(
      isImagePath('users/015/331/014/avatars/large/83f8741ac7.'),
    ).toBe(true);
  });

  it('should accept supported image extensions', () => {
    expect(
      isImagePath('movies/000/759/944/posters/thumb/a12a59d031.jpg.webp'),
    ).toBe(true);
  });

  it('should accept uppercase image extensions', () => {
    expect(
      isImagePath('users/015/331/014/avatars/large/83f8741ac7.JPG'),
    ).toBe(true);
  });

  it('should reject a path with traversal segments', () => {
    expect(
      isImagePath('movies/000/759/944/posters/thumb/../a12a59d031.jpg'),
    ).toBe(false);
  });

  describe('for the versioned avatar form', () => {
    it('should accept it', () => {
      expect(isImagePath(AVATAR_PATH)).toBe(true);
    });

    it('should accept a one-digit and a ten-digit user id', () => {
      expect(isImagePath('users/1/avatar.webp?v=1754435517')).toBe(true);
      expect(isImagePath('users/1234567890/avatar.webp?v=1754435517')).toBe(
        true,
      );
    });

    it.each([
      ['no version', 'users/1/avatar.webp'],
      ['an empty version', 'users/1/avatar.webp?v='],
      ['a non-digit version', 'users/1/avatar.webp?v=abc'],
      ['a nine-digit version', 'users/1/avatar.webp?v=175443551'],
      ['an eleven-digit version', 'users/1/avatar.webp?v=17544355170'],
      ['a leading zero in the version', 'users/1/avatar.webp?v=0754435517'],
      ['a leading zero in the id', 'users/01/avatar.webp?v=1754435517'],
      ['an eleven-digit id', 'users/12345678901/avatar.webp?v=1754435517'],
      ['an extra parameter', 'users/1/avatar.webp?v=1754435517&x=1'],
      ['another parameter first', 'users/1/avatar.webp?x=1&v=1754435517'],
      ['another extension', 'users/1/avatar.jpg?v=1754435517'],
      ['another character for the dot', 'users/1/avatarxwebp?v=1754435517'],
      ['the images prefix', 'images/users/1/avatar.webp?v=1754435517'],
      ['an uppercase kind', 'USERS/1/avatar.webp?v=1754435517'],
      ['an uppercase filename', 'users/1/AVATAR.WEBP?v=1754435517'],
      ['an uppercase parameter', 'users/1/avatar.webp?V=1754435517'],
      ['a trailing newline', 'users/1/avatar.webp?v=1754435517\n'],
    ])('should refuse %s', (_, path) => {
      expect(isImagePath(path)).toBe(false);
    });

    it('should refuse the seven-segment form carrying a query', () => {
      expect(
        isImagePath(
          'users/015/331/014/avatars/large/83f8741ac7.jpg?v=1754435517',
        ),
      ).toBe(false);
    });
  });

  describe('for the movie art form', () => {
    it('should accept it', () => {
      expect(isImagePath(MOVIE_ART_PATH)).toBe(true);
    });

    it.each(['poster', 'fanart', 'logo'])(
      'should accept the art %s',
      (art) => {
        expect(isImagePath(`movies/1039/medium/${art}.webp`)).toBe(true);
      },
    );

    it.each(MEDIA_ART_SIZES)(
      'should accept the size %s',
      (size) => {
        expect(isImagePath(`movies/12808/${size}/poster.webp`)).toBe(true);
      },
    );

    it('should accept a one-digit and a ten-digit id', () => {
      expect(isImagePath('movies/1/medium/poster.webp')).toBe(true);
      expect(isImagePath('movies/1234567890/medium/poster.webp')).toBe(true);
    });

    it.each([
      ['a leading zero in the id', 'movies/012808/medium/poster.webp'],
      ['the large size', 'movies/12808/large/poster.webp'],
      ['art no mapper reads', 'movies/1039/medium/banner.webp'],
      ['an id of zero', 'movies/0/medium/poster.webp'],
      ['a non-numeric id', 'movies/abc/medium/poster.webp'],
      ['an eleven-digit id', 'movies/12345678901/medium/poster.webp'],
      ['no id', 'movies/medium/poster.webp'],
      ['an empty id', 'movies//medium/poster.webp'],
      ['an extra segment', 'movies/12808/medium/extra/poster.webp'],
      ['a leading segment', 'x/movies/12808/medium/poster.webp'],
      ['a traversal in the id', 'movies/../medium/poster.webp'],
      ['a traversal after the size', 'movies/12808/medium/../poster.webp'],
      ['an unknown size', 'movies/12808/small/poster.webp'],
      ['an uppercase size', 'movies/12808/MEDIUM/poster.webp'],
      ['an unknown art name', 'movies/12808/medium/character.webp'],
      ['an art name it only starts with', 'movies/12808/medium/posterx.webp'],
      ['the jpg extension', 'movies/12808/medium/poster.jpg'],
      ['the png extension', 'movies/12808/medium/poster.png'],
      ['the doubled extension', 'movies/12808/medium/poster.jpg.webp'],
      ['no extension', 'movies/12808/medium/poster'],
      ['another character for the dot', 'movies/12808/medium/posterxwebp'],
      ['a query string', 'movies/12808/medium/poster.webp?v=1754435517'],
      ['an empty query string', 'movies/12808/medium/poster.webp?'],
      ['a fragment', 'movies/12808/medium/poster.webp#x'],
      ['the images prefix', 'images/movies/12808/medium/poster.webp'],
      ['an uppercase kind', 'MOVIES/12808/medium/poster.webp'],
      ['a trailing newline', 'movies/12808/medium/poster.webp\n'],
    ])('should refuse %s', (_, path) => {
      expect(isImagePath(path)).toBe(false);
    });
  });

  describe('for the other kinds at the root', () => {
    it.each([
      'movies/1039/medium/thumb.webp',
      'shows/180770/medium/poster.webp',
      'shows/180770/medium/fanart.webp',
      'shows/180770/medium/logo.webp',
      'shows/180770/medium/thumb.webp',
      'seasons/257490/medium/poster.webp',
      'seasons/257490/medium/fanart.webp',
      'seasons/257490/medium/thumb.webp',
      'episodes/5165667/medium/screenshot.webp',
      'people/415018/medium/headshot.webp',
      'people/415018/medium/fanart.webp',
    ])('should accept %s', (path) => {
      expect(isImagePath(path)).toBe(true);
    });

    it.each([
      ['the character art', 'people/415018/medium/character.webp'],
      ['an unknown kind', 'lists/1/medium/poster.webp'],
      ['a nested path', 'shows/180770/seasons/1/medium/poster.webp'],
      ['a leading zero in the id', 'shows/0180770/medium/poster.webp'],
      ['the large size', 'shows/180770/large/poster.webp'],
      ['the banner art', 'shows/180770/medium/banner.webp'],
      ['the clearart art', 'seasons/257490/medium/clearart.webp'],
      ['the images prefix', 'images/shows/180770/medium/poster.webp'],
    ])('should refuse %s', (_, path) => {
      expect(isImagePath(path)).toBe(false);
    });
  });
});
