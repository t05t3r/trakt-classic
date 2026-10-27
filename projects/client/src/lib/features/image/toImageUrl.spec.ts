import { describe, expect, it } from 'vitest';
import { toImageUrl } from './toImageUrl.ts';

const placeholder = '/placeholder.svg';

describe('toImageUrl', () => {
  it('should proxy valid Trakt image URLs', () => {
    expect(
      toImageUrl({
        url:
          'https://media.trakt.tv/images/movies/000/012/601/posters/thumb/e0d9dd35c5.jpg.webp',
        placeholder,
      }),
    ).toBe('/img/movies/000/012/601/posters/thumb/e0d9dd35c5.jpg.webp');
  });

  it('should keep Gravatar URLs, asking for a 404 on a missing avatar', () => {
    expect(
      toImageUrl({
        url: 'https://secure.gravatar.com/avatar/abc',
        placeholder,
      }),
    ).toBe('https://secure.gravatar.com/avatar/abc?d=404');
  });

  it('should use the placeholder for invalid hosts and paths', () => {
    expect(
      toImageUrl({
        url:
          'https://example.com/images/movies/000/012/601/posters/thumb/e0d9dd35c5.jpg.webp',
        placeholder,
      }),
    ).toBe(placeholder);
  });
});
