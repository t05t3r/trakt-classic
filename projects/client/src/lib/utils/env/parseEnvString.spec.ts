import { describe, expect, it } from 'vitest';
import { parseEnvString } from './parseEnvString.ts';

describe('util: parseEnvString', () => {
  it('should fall back to the default when the value is undefined', () => {
    expect(
      parseEnvString({ value: undefined, fallback: '.cache/images' }),
    ).toBe('.cache/images');
  });

  it('should fall back to the default when the value is an empty string', () => {
    expect(parseEnvString({ value: '', fallback: '.cache/images' }))
      .toBe('.cache/images');
  });

  it('should fall back to the default when the value is whitespace only', () => {
    expect(parseEnvString({ value: '   ', fallback: '.cache/images' }))
      .toBe('.cache/images');
  });

  it('should keep an explicit non-empty value', () => {
    expect(
      parseEnvString({
        value: '/var/cache/trakt/images',
        fallback: '.cache/images',
      }),
    ).toBe('/var/cache/trakt/images');
  });
});
