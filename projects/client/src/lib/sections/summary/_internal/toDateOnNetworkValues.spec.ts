import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { describe, expect, it } from 'vitest';
import { toDateOnNetworkValues } from './toDateOnNetworkValues.ts';

const AIRED = new Date('2026-04-20T04:00:00.000Z');

describe('toDateOnNetworkValues', () => {
  it('should read the date on the network', () => {
    expect(
      toDateOnNetworkValues({
        key: 'aired',
        date: AIRED,
        pattern: 'd MMMM yyyy HH:mm',
        network: 'MGM+',
      }),
    ).toEqual([{ key: 'aired', text: '20 April 2026 04:00 on MGM+' }]);
  });

  it("should print the date and time in the viewer's time zone", () => {
    setTimeZone('Asia/Tokyo');

    expect(
      toDateOnNetworkValues({
        key: 'aired',
        date: AIRED,
        pattern: 'd MMMM yyyy HH:mm',
        network: 'MGM+',
      }),
    ).toEqual([{ key: 'aired', text: '20 April 2026 13:00 on MGM+' }]);
  });

  it('should read the date alone when the show has no network', () => {
    expect(
      toDateOnNetworkValues({
        key: 'premiered',
        date: AIRED,
        pattern: 'd MMMM yyyy',
        network: null,
      }),
    ).toEqual([{ key: 'premiered', text: '20 April 2026' }]);
  });

  it.each([
    ['the date is unknown', MAX_DATE],
    ['the date is invalid', new Date(NaN)],
  ])('should read nothing when %s', (_, date) => {
    expect(
      toDateOnNetworkValues({
        key: 'aired',
        date,
        pattern: 'd MMMM yyyy HH:mm',
        network: 'MGM+',
      }),
    ).toEqual([]);
  });
});
