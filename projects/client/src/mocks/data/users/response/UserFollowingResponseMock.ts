import type { FollowerResponse } from '@trakt/api';
import { UserProfileHarryResponseMock } from '$mocks/data/users/response/UserProfileHarryResponseMock.ts';

export const UserFollowingResponseMock: FollowerResponse[] = [
  {
    followed_at: '2025-01-31T23:12:41.000Z',
    user: UserProfileHarryResponseMock,
  },
];
