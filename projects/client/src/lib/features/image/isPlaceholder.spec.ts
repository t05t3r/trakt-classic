import { describe, expect, it } from 'vitest';
import { isPlaceholder } from './isPlaceholder.ts';
import { PLACEHOLDERS } from './placeholders.ts';

describe('isPlaceholder', () => {
  it('should recognise the poster Placeholder', () => {
    expect(isPlaceholder(PLACEHOLDERS.poster)).toBe(true);
  });

  it('should recognise the fanart Placeholder', () => {
    expect(isPlaceholder(PLACEHOLDERS.fanart)).toBe(true);
  });

  it('should recognise the avatar Placeholder', () => {
    expect(isPlaceholder(PLACEHOLDERS.avatar)).toBe(true);
  });

  it('should not treat an Image Proxy path as a Placeholder', () => {
    expect(
      isPlaceholder(
        '/img/movies/000/012/601/posters/thumb/e0d9dd35c5.jpg.webp',
      ),
    ).toBe(false);
  });

  it('should not treat a Gravatar URL as a Placeholder', () => {
    expect(
      isPlaceholder(
        'https://secure.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50',
      ),
    ).toBe(false);
  });
});
