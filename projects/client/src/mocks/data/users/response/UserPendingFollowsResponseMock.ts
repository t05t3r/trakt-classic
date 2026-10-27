import type { RequestsResponse } from '@trakt/api';
import { UserProfileHarryResponseMock } from '$mocks/data/users/response/UserProfileHarryResponseMock.ts';

export const UserPendingFollowsResponseMock: RequestsResponse[] = [
  {
    id: 1,
    requested_at: '2025-01-31T23:12:41.000Z',
    user: UserProfileHarryResponseMock,
  },
];
