import { describe, expect, it } from 'vitest';
import { sniffImageType } from './sniffImageType.ts';

function bytesOf(values: ReadonlyArray<number>, length = 12): Uint8Array {
  const bytes = new Uint8Array(length);
  bytes.set(values, 0);
  return bytes;
}

describe('sniffImageType', () => {
  it('should recognize a JPEG signature regardless of the path extension', () => {
    const bytes = bytesOf([0xff, 0xd8, 0xff, 0xe0]);

    expect(sniffImageType({ bytes, path: 'avatars/large/hash.png' })).toBe(
      'image/jpeg',
    );
  });

  it('should recognize a PNG signature', () => {
    const bytes = bytesOf([0x89, 0x50, 0x4e, 0x47]);

    expect(sniffImageType({ bytes, path: 'a/b.jpg' })).toBe('image/png');
  });

  it('should recognize a GIF signature', () => {
    const bytes = bytesOf([0x47, 0x49, 0x46, 0x38]);

    expect(sniffImageType({ bytes, path: 'a/b.jpg' })).toBe('image/gif');
  });

  it('should recognize a WebP RIFF container', () => {
    const bytes = new Uint8Array(12);
    bytes.set([0x52, 0x49, 0x46, 0x46], 0);
    bytes.set([0x57, 0x45, 0x42, 0x50], 8);

    expect(sniffImageType({ bytes, path: 'a/b.jpg' })).toBe('image/webp');
  });

  it('should fall back to the last extension when the signature is unrecognized', () => {
    const bytes = bytesOf([]);

    expect(
      sniffImageType({ bytes, path: 'movies/000/012/601/e.jpg.webp' }),
    ).toBe('image/webp');
  });

  it('should treat the extension fallback as case-insensitive', () => {
    const bytes = bytesOf([]);

    expect(sniffImageType({ bytes, path: 'users/avatars/large/hash.JPG' }))
      .toBe('image/jpeg');
  });

  it('should default to image/jpeg for a bare-dot filename with no recognized signature', () => {
    const bytes = bytesOf([]);

    expect(
      sniffImageType({ bytes, path: 'users/015/331/014/avatars/large/a.' }),
    ).toBe('image/jpeg');
  });
});
