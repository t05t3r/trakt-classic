import { SILO_PROGRESS_URL } from '$mocks/data/shows/SILO_PROGRESS_URL.ts';
import { ShowSiloProgressHiddenSeasonTwoResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressHiddenSeasonTwoResponseMock.ts';
import { ShowSiloProgressResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressResponseMock.ts';
import { HIDE_PROGRESS_URL } from '$mocks/data/users/HIDE_PROGRESS_URL.ts';
import { HiddenSeasonsResponseMock } from '$mocks/data/users/response/HiddenSeasonsResponseMock.ts';
import { server } from '$mocks/server.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { http, HttpResponse } from 'msw';

// Season two hidden, in the hidden seasons list too, unless the read asks for the hidden seasons back; returns each read's `hidden`.
export function serveSiloHidingSeasonTwo(): ReadonlyArray<string | null> {
  const hiddenReads: Array<string | null> = [];
  servePaged({ url: HIDE_PROGRESS_URL, body: HiddenSeasonsResponseMock });
  server.use(
    http.get(SILO_PROGRESS_URL, ({ request }) => {
      const hidden = new URL(request.url).searchParams.get('hidden');
      hiddenReads.push(hidden);

      return HttpResponse.json(
        hidden === 'true'
          ? ShowSiloProgressResponseMock
          : ShowSiloProgressHiddenSeasonTwoResponseMock,
      );
    }),
  );

  return hiddenReads;
}
