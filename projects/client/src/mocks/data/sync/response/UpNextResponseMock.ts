import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { ShowDevsResponseMock } from '$mocks/data/summary/shows/devs/ShowDevsResponseMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import type { UpNextResponse } from '@trakt/api';

export const UpNextResponseMock: UpNextResponse[] = [
  {
    show: ShowSiloResponseMock,
    progress: {
      'aired': 20,
      'completed': 0,
      'last_watched_at': '2025-01-28T12:53:21.000Z',
      'reset_at': null,
      'stats': {
        'play_count': 11,
        'minutes_watched': 545,
        'minutes_left': 471,
      },
      'next_episode': EpisodeSiloResponseMock,
      'last_episode': {
        'season': 2,
        'number': 1,
        'title': 'The Engineer',
        'ids': {
          'trakt': 12105047,
          'tvdb': 10232256,
          'imdb': 'tt28077708',
          'tmdb': 5501094,
        },
        'number_abs': null,
        'overview':
          "Juliette finds sanctuary in a silo long ago destroyed by war, thinking she's alone.",
        'rating': 7.41676,
        'votes': 2829,
        'comment_count': 50,
        'first_aired': '2024-11-15T02:00:00.000Z',
        'updated_at': '2025-02-02T13:10:30.000Z',
        'available_translations': [
          'ar',
          'cs',
          'da',
          'de',
          'el',
          'en',
          'es',
          'fi',
          'fr',
          'he',
          'hi',
          'hu',
          'id',
          'it',
          'ja',
          'ko',
          'nl',
          'no',
          'pl',
          'pt',
          'ru',
          'sk',
          'sv',
          'th',
          'tr',
          'uk',
          'vi',
          'zh',
        ],
        'runtime': 46,
        'episode_type': 'season_premiere',
        'images': {
          'screenshot': [
            'media.trakt.tv/images/episodes/012/105/047/screenshots/medium/bbe831c174.jpg.webp',
            'image.tmdb.org/t/p/w1280/kB5wWdEknKlBJ8iGEYQyTJWTSZv.jpg',
          ],
        },
      },
    },
  },
  // Watched to the end, so it has no next episode.
  {
    show: ShowDevsResponseMock,
    progress: {
      'aired': 8,
      'completed': 8,
      'last_watched_at': '2025-01-20T21:04:00.000Z',
      'reset_at': null,
      'next_episode': null,
      'last_episode': null,
    },
  },
];
