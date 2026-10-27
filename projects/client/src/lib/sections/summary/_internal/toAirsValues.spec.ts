import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toAirsValues } from './toAirsValues.ts';

const WINTER = new Date('2025-01-08T12:00:00.000Z');
const SUMMER = new Date('2025-07-09T12:00:00.000Z');

function airsText(show: ShowEntry = ShowSiloMappedMock) {
  return toAirsValues(show).map((value) => 'text' in value && value.text);
}

describe('toAirsValues', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(WINTER);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should print the slot in the viewer zone with the network', () => {
    expect(toAirsValues(ShowSiloMappedMock)).toEqual([
      { key: 'airs', text: 'Fridays at 02:00 on Apple TV+' },
    ]);
  });

  it('should convert the slot for a viewer west of UTC', () => {
    setTimeZone('America/Los_Angeles');

    expect(airsText()).toEqual(['Thursdays at 18:00 on Apple TV+']);
  });

  it('should move the day for a viewer east of UTC', () => {
    setTimeZone('Asia/Tokyo');

    expect(airsText()).toEqual(['Fridays at 11:00 on Apple TV+']);
  });

  it("should read the source zone's daylight saving in the current week", () => {
    vi.setSystemTime(SUMMER);
    setTimeZone('Europe/Istanbul');
    const show = {
      ...ShowSiloMappedMock,
      network: 'MGM+',
      airs: { day: 'Sunday', time: '21:00', timezone: 'America/New_York' },
    };

    expect(airsText(show)).toEqual(['Mondays at 04:00 on MGM+']);
  });

  it.each(['returning series', 'in production'] as const)(
    'should print the slot of a show whose status is %s',
    (status) => {
      expect(airsText({ ...ShowSiloMappedMock, status })).toHaveLength(1);
    },
  );

  it.each(['ended', 'canceled'] as const)(
    'should skip the slot of a show whose status is %s',
    (status) => {
      expect(toAirsValues({ ...ShowSiloMappedMock, status })).toEqual([]);
    },
  );

  it('should skip the slot without airs', () => {
    expect(toAirsValues({ ...ShowSiloMappedMock, airs: undefined }))
      .toEqual([]);
  });

  it('should skip the slot without a network', () => {
    expect(toAirsValues({ ...ShowSiloMappedMock, network: null })).toEqual([]);
  });

  it('should skip a slot whose day does not convert', () => {
    const airs = { day: 'Funday', time: '21:00', timezone: 'America/New_York' };

    expect(toAirsValues({ ...ShowSiloMappedMock, airs })).toEqual([]);
  });
});
