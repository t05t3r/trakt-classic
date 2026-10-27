import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ExtendedUserSettingsMappedMock } from '$mocks/data/users/mapped/ExtendedUserSettingsMappedMock.ts';
import { EarlyRatingsUserSettingsResponseMock } from '$mocks/data/users/response/EarlyRatingsUserSettingsResponseMock.ts';
import { USER_SETTINGS_URL } from '$mocks/data/users/USER_SETTINGS_URL.ts';
import { server } from '$mocks/server.ts';
import { currentUserSettingsQuery } from './currentUserSettingsQuery.ts';

describe('currentUserSettingsQuery', () => {
  it('should query for user profile', async () => {
    const result = await runQuery({
      factory: () => createTestBedQuery(currentUserSettingsQuery()),
      mapper: (response) => response?.data,
    });

    expect(result).to.deep.equal(ExtendedUserSettingsMappedMock);
  });

  it('should map the early ratings setting', async () => {
    server.use(
      http.get(
        USER_SETTINGS_URL,
        () => HttpResponse.json(EarlyRatingsUserSettingsResponseMock),
      ),
    );

    const result = await runQuery({
      factory: () => createTestBedQuery(currentUserSettingsQuery()),
      mapper: (response) => response?.data,
    });

    expect(result).to.deep.equal({
      ...ExtendedUserSettingsMappedMock,
      preferences: {
        ...ExtendedUserSettingsMappedMock.preferences,
        displayEarlyRatings: true,
      },
    });
  });
});
