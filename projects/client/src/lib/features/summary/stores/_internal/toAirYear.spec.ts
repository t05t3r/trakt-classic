import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { describe, expect, it } from 'vitest';
import { toAirYear } from './toAirYear.ts';

describe('toAirYear', () => {
  it('should read the year of the air date', () => {
    expect(toAirYear({ airDate: new Date('2023-05-05T01:00:00.000Z') }))
      .toBe(2023);
  });

  it("should read the year in the viewer's time zone", () => {
    setTimeZone('Asia/Tokyo');

    expect(toAirYear({ airDate: new Date('2022-12-31T23:00:00.000Z') }))
      .toBe(2023);
  });

  it('should read no year for no air date', () => {
    expect(toAirYear({ airDate: MAX_DATE })).toBeUndefined();
  });

  it('should read no year for an invalid air date', () => {
    expect(toAirYear({ airDate: new Date('') })).toBeUndefined();
  });
});
