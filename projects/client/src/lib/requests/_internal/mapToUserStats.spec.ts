import { UserStatsMappedMock } from '$mocks/data/users/mapped/UserStatsMappedMock.ts';
import { UserStatsResponseMock } from '$mocks/data/users/response/UserStatsResponseMock.ts';
import { describe, expect, it } from 'vitest';
import { mapToUserStats } from './mapToUserStats.ts';

describe('util: mapToUserStats', () => {
  it('should map the rating distribution', () => {
    expect(mapToUserStats(UserStatsResponseMock).ratings.distribution).toEqual(
      UserStatsResponseMock.ratings.distribution,
    );
  });

  it('should map the full response to the domain model', () => {
    expect(mapToUserStats(UserStatsResponseMock)).toEqual(UserStatsMappedMock);
  });
});
