import { describe, expect, it } from 'vitest';
import { toCertificationText } from './toCertificationText.ts';

describe('util: toCertificationText', () => {
  it('should describe NR as not rated', () => {
    expect(toCertificationText('NR')).toBe('Not Rated');
  });

  it('should describe a hyphenated name', () => {
    expect(toCertificationText('PG-13')).toBe(
      'Parents Strongly Cautioned - Ages 13+ Recommended',
    );
  });

  it.each(['Not Rated', 'pg-13', 'constructor'])(
    'should describe nothing for %s, a name outside the table',
    (name) => {
      expect(toCertificationText(name)).toBeUndefined();
    },
  );
});
