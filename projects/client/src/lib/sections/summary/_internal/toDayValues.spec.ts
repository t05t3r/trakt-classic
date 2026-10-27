import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { describe, expect, it } from 'vitest';
import { toDayValues } from './toDayValues.ts';

describe('toDayValues', () => {
  it('should read the day of the date', () => {
    expect(toDayValues('released', new Date('2026-04-20T04:00:00.000Z')))
      .toEqual([{ key: 'released', text: '20 April 2026' }]);
  });

  it.each([
    ['the date is unknown', MAX_DATE],
    ['the date is invalid', new Date('')],
  ])('should read nothing when %s', (_, date) => {
    expect(toDayValues('released', date)).toEqual([]);
  });
});
