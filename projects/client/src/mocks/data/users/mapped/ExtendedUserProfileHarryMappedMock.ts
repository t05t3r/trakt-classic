import type { UserProfile } from '$lib/requests/models/UserProfile.ts';
import { UserProfileHarryMappedMock } from '$mocks/data/users/mapped/UserProfileHarryMappedMock.ts';

export const ExtendedUserProfileHarryMappedMock: UserProfile = {
  ...UserProfileHarryMappedMock,
  location: 'San Francisco, CA',
  about: 'I am a Lieutenant',
};
