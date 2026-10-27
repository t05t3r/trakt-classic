import { ShowSiloPeopleMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloPeopleMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { toCastGroups } from './toCastGroups.ts';

describe('toCastGroups', () => {
  it('should read the cast as one group, leaving the guest stars out', () => {
    expect(toCastGroups(ShowSiloPeopleMappedMock)).toEqual([
      { key: 'cast', members: ShowSiloPeopleMappedMock.cast },
    ]);
  });
});
