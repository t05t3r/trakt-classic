import type { ShowProgressDetail } from '$lib/requests/models/ShowProgressDetail.ts';

export const ShowSiloProgressMappedMock: ShowProgressDetail = {
  'total': 17,
  'completed': 11,
  'lastWatchedAt': new Date('2024-12-27T19:40:28.000Z'),
  'nextEpisode': {
    'id': 12105048,
    'imdbId': 'tt28100075',
    'key': 'episode-12105048',
    'type': 'standard',
    'title': 'Order',
    'overview':
      "In Silo 18, shock and unrest take hold in the wake of Juliette doing what no one's done before.",
    'season': 2,
    'number': 2,
    'genres': [],
    'runtime': 42,
    'cover': {
      'url': {
        'thumb':
          '/img/episodes/012/105/048/screenshots/thumb/2f894ac614.jpg.webp',
        'medium':
          '/img/episodes/012/105/048/screenshots/medium/2f894ac614.jpg.webp',
        'full':
          '/img/episodes/012/105/048/screenshots/full/2f894ac614.jpg.webp',
      },
    },
    'airDate': new Date('2024-11-22T02:00:00.000Z'),
    'releaseDate': new Date('2024-11-22T02:00:00.000Z'),
    'effectiveReleaseDate': new Date('2024-11-22T02:00:00.000Z'),
    'year': 2024,
    'postCredits': [],
    'rating': 0.7456,
    'votes': 1838,
    'updatedAt': new Date('2024-12-27T19:32:56.000Z'),
  },
  'seasons': [
    {
      'number': 1,
      'total': 10,
      'completed': 10,
      'lastWatchedAt': new Date('2024-12-27T19:40:26.000Z'),
    },
    {
      'number': 2,
      'total': 7,
      'completed': 1,
      'lastWatchedAt': new Date('2024-12-27T19:40:28.000Z'),
    },
  ],
};
