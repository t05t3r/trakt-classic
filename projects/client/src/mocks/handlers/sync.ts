import { http, HttpResponse } from 'msw';
import { pageHeaders } from '$mocks/pageHeaders.ts';

import { MediaLibraryResponseMock } from '$mocks/data/sync/response/MediaLibraryResponseMock.ts';
import { UpNextResponseMock } from '$mocks/data/sync/response/UpNextResponseMock.ts';
import { WatchlistAllResponseMock } from '$mocks/data/sync/response/WatchlistAllResponseMock.ts';
import { WatchlistPreviewResponseMock } from '$mocks/data/sync/response/WatchlistPreviewResponseMock.ts';
import { SYNC_FAVORITES_REMOVE_URL } from '$mocks/data/sync/SYNC_FAVORITES_REMOVE_URL.ts';
import { SYNC_FAVORITES_URL } from '$mocks/data/sync/SYNC_FAVORITES_URL.ts';
import { SYNC_HISTORY_REMOVE_URL } from '$mocks/data/sync/SYNC_HISTORY_REMOVE_URL.ts';
import { SYNC_HISTORY_URL } from '$mocks/data/sync/SYNC_HISTORY_URL.ts';
import { SYNC_RATINGS_REMOVE_URL } from '$mocks/data/sync/SYNC_RATINGS_REMOVE_URL.ts';
import { SYNC_RATINGS_URL } from '$mocks/data/sync/SYNC_RATINGS_URL.ts';
import { SYNC_WATCHLIST_REMOVE_URL } from '$mocks/data/sync/SYNC_WATCHLIST_REMOVE_URL.ts';
import { SYNC_WATCHLIST_URL } from '$mocks/data/sync/SYNC_WATCHLIST_URL.ts';
import { WATCHLIST_URL } from '$mocks/data/sync/WATCHLIST_URL.ts';

export const sync = [
  http.post(
    SYNC_HISTORY_URL,
    () => {
      return new HttpResponse(null, {
        status: 201,
      });
    },
  ),
  http.post(
    SYNC_WATCHLIST_URL,
    () => {
      return new HttpResponse(null, {
        status: 201,
      });
    },
  ),
  http.post(
    SYNC_RATINGS_URL,
    () => {
      return new HttpResponse(null, {
        status: 201,
      });
    },
  ),
  http.post(
    SYNC_FAVORITES_URL,
    () => {
      return new HttpResponse(null, {
        status: 201,
      });
    },
  ),
  http.post(
    SYNC_HISTORY_REMOVE_URL,
    () => {
      return new HttpResponse(null, {
        status: 200,
      });
    },
  ),
  http.post(
    SYNC_WATCHLIST_REMOVE_URL,
    () => {
      return new HttpResponse(null, {
        status: 200,
      });
    },
  ),
  http.post(
    SYNC_RATINGS_REMOVE_URL,
    () => {
      return new HttpResponse(null, {
        status: 200,
      });
    },
  ),
  http.post(
    SYNC_FAVORITES_REMOVE_URL,
    () => {
      return new HttpResponse(null, {
        status: 200,
      });
    },
  ),
  http.post(
    'http://localhost/sync/collection/remove',
    () => {
      return new HttpResponse(null, {
        status: 200,
      });
    },
  ),
  http.get(WATCHLIST_URL, (response) => {
    const { searchParams } = new URL(response.request.url);
    const extended = searchParams.get('extended');

    if (extended === 'full,images') {
      return HttpResponse.json(WatchlistPreviewResponseMock, {
        headers: pageHeaders({
          itemCount: WatchlistPreviewResponseMock.length,
        }),
      });
    }

    return HttpResponse.json(WatchlistAllResponseMock, {
      headers: pageHeaders(),
    });
  }),
  http.get(
    'http://localhost/sync/progress/up_next*',
    () => {
      return HttpResponse.json(UpNextResponseMock);
    },
  ),
  http.get(
    'http://localhost/sync/collection/media',
    () => {
      return HttpResponse.json(MediaLibraryResponseMock);
    },
  ),
];
