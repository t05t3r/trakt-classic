import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { ExtendedUserSettingsResponseMock } from '$mocks/data/users/response/ExtendedUserSettingsResponseMock.ts';

const BROWSING = assertDefined(ExtendedUserSettingsResponseMock.browsing);

export const HideCommentSpoilersUserSettingsResponseMock = {
  ...ExtendedUserSettingsResponseMock,
  browsing: {
    ...BROWSING,
    spoilers: { ...BROWSING.spoilers, comments: 'hide' },
  },
};
