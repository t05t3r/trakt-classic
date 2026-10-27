import { ShowSiloPeopleMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloPeopleMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { toRegularsGroups } from './toRegularsGroups.ts';

const { cast, guestStars } = ShowSiloPeopleMappedMock;

describe('toRegularsGroups', () => {
  it('should read the regulars under the given key, then the guest stars', () => {
    expect(toRegularsGroups('regulars')({ cast, guestStars })).toEqual([
      { key: 'regulars', members: cast },
      { key: 'guest', members: guestStars },
    ]);
  });

  it("should read a season's regulars under their own key", () => {
    expect(toRegularsGroups('seasonRegulars')({ cast, guestStars }))
      .toEqual([
        { key: 'seasonRegulars', members: cast },
        { key: 'guest', members: guestStars },
      ]);
  });
});
