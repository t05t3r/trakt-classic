import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import type { ShowProgressResponse } from '@trakt/api';
import { ShowSiloProgressResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressResponseMock.ts';
import { ShowSiloSeasonsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsResponseMock.ts';

const [seasonOne] = ShowSiloProgressResponseMock.seasons;

// Its second season hidden: the counts, the stats and the next episode leave it out.
export const ShowSiloProgressHiddenSeasonTwoResponseMock: ShowProgressResponse =
  {
    ...ShowSiloProgressResponseMock,
    'aired': 10,
    'completed': 10,
    'stats': {
      'play_count': 11,
      'minutes_watched': 559,
      'minutes_left': 0,
    },
    'seasons': [assertDefined(seasonOne)],
    'hidden_seasons': [
      assertDefined(
        ShowSiloSeasonsResponseMock.find(({ number }) => number === 2),
      ),
    ],
    'next_episode': null,
  };
