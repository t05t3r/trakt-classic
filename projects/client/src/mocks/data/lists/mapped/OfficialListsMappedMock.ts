import type { MediaListSummary } from '$lib/requests/models/MediaListSummary.ts';
import { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';

export const OfficialListsMappedMock: MediaListSummary[] = [
  {
    'description': 'This is super official',
    'id': 2345,
    'key': 'list-2345',
    'likeCount': 4161,
    'name': 'Official list',
    'slug': 'official-list',
    'count': 2,
    'sortBy': 'added',
    'sortHow': 'asc',
    'privacy': 'public',
    'user': {
      'username': 'Trakt',
      'id': 0,
      'key': 'user-0',
      'avatar': {
        'url': PLACEHOLDERS.avatar,
      },
      'name': {
        'full': '',
        'first': '',
        'last': '',
      },
      'slug': null,
      'private': false,
      'isVip': false,
      'isDeleted': false,
      'isDirector': false,
      'about': undefined,
      'location': undefined,
      'joinedAt': null,
    },
    'posters': [],
    'updatedAt': new Date('2025-02-09T21:39:59.000Z'),
    'type': 'official',
  },
];
