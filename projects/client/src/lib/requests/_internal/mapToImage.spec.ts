import { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';
import { describe, expect, it } from 'vitest';
import { mapToImage } from './mapToImage.ts';

describe('mapToImage', () => {
  it('should map one original Trakt image into every display size', () => {
    const result = mapToImage({
      candidate:
        'media.trakt.tv/images/movies/000/916/302/posters/original/db9d66deb8.jpg.webp',
      placeholder: PLACEHOLDERS.poster,
    });

    expect(result).toEqual({
      medium: '/img/movies/000/916/302/posters/medium/db9d66deb8.jpg.webp',
      thumb: '/img/movies/000/916/302/posters/thumb/db9d66deb8.jpg.webp',
      full: '/img/movies/000/916/302/posters/full/db9d66deb8.jpg.webp',
    });
  });

  it('should fall back to the placeholder in every size for a non-Trakt candidate', () => {
    const result = mapToImage({
      candidate: 'image.tmdb.org/t/p/original/lzCB9YN6MjGosh8v27o6omhSmjL.jpg',
      placeholder: PLACEHOLDERS.avatar,
    });

    expect(result).toEqual({
      medium: PLACEHOLDERS.avatar,
      thumb: PLACEHOLDERS.avatar,
      full: PLACEHOLDERS.avatar,
    });
  });

  it('should fall back to the placeholder in every size when there is no candidate', () => {
    const result = mapToImage({
      candidate: undefined,
      placeholder: PLACEHOLDERS.poster,
    });

    expect(result).toEqual({
      medium: PLACEHOLDERS.poster,
      thumb: PLACEHOLDERS.poster,
      full: PLACEHOLDERS.poster,
    });
  });
});
