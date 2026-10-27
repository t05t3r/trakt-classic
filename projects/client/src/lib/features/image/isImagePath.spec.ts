import { describe, expect, it } from 'vitest';
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
});
