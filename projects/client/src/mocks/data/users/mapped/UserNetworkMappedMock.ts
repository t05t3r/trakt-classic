import type { UserNetwork } from '$lib/features/auth/queries/currentUserNetworkQuery.ts';
import { UserProfileHarryMappedMock } from '$mocks/data/users/mapped/UserProfileHarryMappedMock.ts';

export const UserNetworkMappedMock: UserNetwork = {
  following: [UserProfileHarryMappedMock],
};
