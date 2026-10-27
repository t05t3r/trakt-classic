import type { UserProfile } from '$lib/requests/models/UserProfile.ts';
import { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';
import { toImageUrl } from '$lib/features/image/toImageUrl.ts';
import { toUserName } from '$lib/utils/formatting/string/toUserName.ts';
import type { ProfileResponse } from '@trakt/api';

export function mapToUserProfile(user: ProfileResponse): UserProfile {
  return {
    id: user.ids.trakt,
    key: `user-${user.ids.trakt}`,
    username: user.username,
    name: toUserName(user.name),
    private: user.private,
    isVip: Boolean(user.vip ?? user.vip_ep),
    isDirector: Boolean(user.director),
    isDeleted: user.deleted,
    slug: user.ids.slug,
    avatar: {
      url: toImageUrl({
        url: user.images?.avatar.full,
        placeholder: PLACEHOLDERS.avatar,
      }),
    },
    location: user.location,
    about: user.about,
    joinedAt: user.joined_at ? new Date(user.joined_at) : null,
  };
}
