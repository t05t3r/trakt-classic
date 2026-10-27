import type { Season } from '$lib/requests/models/Season.ts';
import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';

export const ShowSiloSeasonFourMappedMock: Season = {
  'id': 456020,
  'key': 'season-456020',
  'number': 4,
  'title': null,
  'episodes': {
    'count': 0,
    'aired': 0,
  },
  'poster': undefined,
  'airDate': MAX_DATE,
  'overview': null,
  'rating': undefined,
  'votes': null,
  'network': 'Apple TV+',
  'totalRuntime': 0,
};
