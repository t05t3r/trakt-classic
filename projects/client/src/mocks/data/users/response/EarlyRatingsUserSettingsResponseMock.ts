import { ExtendedUserSettingsResponseMock } from '$mocks/data/users/response/ExtendedUserSettingsResponseMock.ts';

export const EarlyRatingsUserSettingsResponseMock = {
  ...ExtendedUserSettingsResponseMock,
  browsing: {
    ...ExtendedUserSettingsResponseMock.browsing,
    display_early_ratings: true,
  },
};
