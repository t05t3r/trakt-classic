import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
import { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';
import { OVERVIEW_PLACEHOLDER } from '$lib/requests/OVERVIEW_PLACEHOLDER.ts';
import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';

export const ShowSiloMinimalMappedMock: ShowEntry = {
  'airDate': MAX_DATE,
  'releaseDate': MAX_DATE,
  'effectiveReleaseDate': MAX_DATE,
  'certification': undefined,
  'country': undefined,
  'cover': {
    'url': {
      'medium': PLACEHOLDERS.fanart,
      'thumb': PLACEHOLDERS.fanart,
      'full': PLACEHOLDERS.fanart,
    },
  },
  'logo': undefined,
  'genres': [],
  'id': 180770,
  'key': 'show-180770',
  'languages': undefined,
  'overview': OVERVIEW_PLACEHOLDER,
  'poster': {
    'url': {
      'medium': PLACEHOLDERS.poster,
      'thumb': PLACEHOLDERS.poster,
      'full': PLACEHOLDERS.poster,
    },
  },
  'runtime': NaN,
  'slug': 'silo',
  'status': 'unknown',
  'rating': undefined,
  'tagline': '',
  'thumb': {
    'url': PLACEHOLDERS.fanart,
  },
  'title': 'Silo',
  'originalTitle': undefined,
  'trailer': undefined,
  'type': 'show',
  'votes': 0,
  'year': 2023,
  'colors': ['#D29D40', '#1E2E2F'],
  'network': undefined,
  'plexSlug': undefined,
  'postCredits': [],
  'episode': {
    'count': 20,
  },
  'totalRuntime': NaN,
  'imdbId': 'tt14688458',
  'tmdbId': 125988,
  'homepage': undefined,
  'socialMedia': undefined,
  'airs': undefined,
};
