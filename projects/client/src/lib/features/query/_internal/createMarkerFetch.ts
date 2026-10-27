import { NetworkError } from './NetworkError.ts';

const defaultMethod = 'GET';

// Network failures reject with a `TypeError`, aborts with their reason.
function rethrowNetworkFailure(error: unknown): never {
  throw error instanceof TypeError ? new NetworkError(error) : error;
}

export function createMarkerFetch<T extends typeof fetch>(
  marker: string | null,
  baseFetch?: T,
): T {
  const fetchImpl = baseFetch || globalThis.fetch;
  const send = (input: Parameters<T>[0], init?: Parameters<T>[1]) =>
    fetchImpl(input, init).catch(rethrowNetworkFailure);

  return (function markerFetch(
    input: Parameters<T>[0],
    init?: Parameters<T>[1],
  ): Promise<Response> {
    if (!(typeof input === 'string') || marker == null) {
      return send(input, init);
    }

    const method = (init?.method ?? defaultMethod).toUpperCase();

    if (method === 'GET') {
      const [path, queryString] = input.split('?');
      const params = new URLSearchParams(queryString || '');
      params.set('marker', marker);
      input = `${path}?${params.toString()}`;
    }

    return send(input, init);
  }) as unknown as T;
}
