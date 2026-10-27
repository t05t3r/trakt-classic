import { server } from '$mocks/server.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { http, type HttpResponseResolver } from 'msw';

type HoldRequestParams = {
  method: 'get' | 'post' | 'delete';
  url: string;
  answer?: HttpResponseResolver;
};

// An omitted answer returns nothing, which hands the request to the default handler.
export function holdRequest(
  { method, url, answer }: HoldRequestParams,
): Readonly<{
  requested: Promise<void>;
  release: () => void;
}> {
  const { answer: held, requested, release } = holdResponse(
    answer ?? (() => undefined),
  );
  server.use(http[method](url, held));

  return { requested, release };
}
