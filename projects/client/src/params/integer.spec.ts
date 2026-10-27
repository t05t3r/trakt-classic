import { describe, expect, it } from 'vitest';
import { match } from './integer.ts';

describe('param: integer', () => {
  it.each(['0', '1', '4', '12'])('should accept the number %s', (param) => {
    expect(match(param)).toBe(true);
  });

  it.each(['', 'one', '-1', '1.5', '1e2', ' 1', '1 ', '0x1', '1a', '04', '00'])(
    "should reject '%s'",
    (param) => {
      expect(match(param)).toBe(false);
    },
  );
});
