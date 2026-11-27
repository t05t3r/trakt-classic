import { server } from '$mocks/server.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { http, type JsonBodyType } from 'msw';

type ServeTwoPagesParams = {
  url: string;
  first: JsonBodyType;
  second: () => Response | Promise<Response>;
};

// The second answer is the caller's, so a spec can hold or fail that page.
export function serveTwoPages({ url, first, second }: ServeTwoPagesParams) {
  server.use(
    http.get(url, ({ request }) => {
      const page = new URL(request.url).searchParams.get('page') ?? '1';
      if (page !== '1') return second();

      return pagedResponse({ body: first, pageCount: 2 });
    }),
  );
}
