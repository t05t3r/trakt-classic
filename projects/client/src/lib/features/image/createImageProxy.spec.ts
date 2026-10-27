// @vitest-environment node
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import { toUserAgent } from '$lib/utils/requests/toUserAgent.ts';
import { SessionMappedMock } from '$mocks/data/auth/mapped/SessionMappedMock.ts';
import { APP_ORIGIN } from '$mocks/data/images/APP_ORIGIN.ts';
import { IMAGE_ORIGIN } from '$mocks/data/images/IMAGE_ORIGIN.ts';
import { POSTER_PATH } from '$mocks/data/images/POSTER_PATH.ts';
import { OnePixelWebpResponseMock } from '$mocks/data/images/response/OnePixelWebpResponseMock.ts';
import { server } from '$mocks/server.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { http, HttpResponse } from 'msw';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from 'vitest';
import { createImageCache } from './createImageCache.ts';
import { createImageProxy } from './createImageProxy.ts';

const avatarBareDotPath = 'users/015/331/014/avatars/large/83f8741ac7.';

const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);

const MAX_BODY_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;

// A body whose read rejects: reading it yields 504, so a 502 proves the check ran before any read.
function brokenStream(): ReadableStream<Uint8Array> {
  return new ReadableStream({
    pull(controller) {
      controller.error(new Error('stream read failed'));
    },
  });
}

// A chunked body with no content-length, over the cap only once every chunk is counted.
function oversizeChunkedStream(): ReadableStream<Uint8Array> {
  const chunks = Array.from({ length: 6 }, () => new Uint8Array(1024 * 1024));

  return new ReadableStream({
    pull(controller) {
      const chunk = chunks.shift();
      if (!chunk) {
        controller.close();
        return;
      }
      controller.enqueue(chunk);
    },
  });
}

// A body that sends no bytes and never ends, erroring on abort as a real fetch body does.
function stalledStream(signal: AbortSignal): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      signal.addEventListener('abort', () => controller.error(signal.reason), {
        once: true,
      });
    },
  });
}

let dir: string;
let proxy: ReturnType<typeof createImageProxy>;
let warn: MockInstance<typeof console.warn>;

async function writeCachedFile(path: string, bytes: Uint8Array): Promise<void> {
  const target = join(dir, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, bytes);
}

beforeEach(async () => {
  warn = vi.spyOn(console, 'warn').mockImplementation(NOOP_FN);
  dir = await mkdtemp(join(tmpdir(), 'image-proxy-'));
  proxy = createImageProxy({
    origin: APP_ORIGIN,
    imageOrigin: IMAGE_ORIGIN,
    cache: createImageCache({ dir, maxBytes: 0, concurrency: 6 }),
  });
});

afterEach(async () => {
  warn.mockRestore();
  await rm(dir, { recursive: true, force: true });
});

describe('createImageProxy', () => {
  it('should identify itself to the origin as this product at the public origin', async () => {
    const userAgents: Array<string | null> = [];
    server.use(
      http.get(`${IMAGE_ORIGIN}/${POSTER_PATH}`, ({ request }) => {
        userAgents.push(request.headers.get('user-agent'));
        return HttpResponse.arrayBuffer(OnePixelWebpResponseMock.buffer, {
          headers: { 'content-type': 'image/webp' },
        });
      }),
    );

    const response = await proxy.serve({
      path: POSTER_PATH,
      session: SessionMappedMock,
      ifNoneMatch: null,
    });

    expect(response.status).toBe(200);
    expect(userAgents).toEqual([toUserAgent(APP_ORIGIN)]);
  });

  it('should refuse a request without a Session before validating the path', async () => {
    const response = await proxy.serve({
      path: 'not-a-valid-path',
      session: null,
      ifNoneMatch: null,
    });

    expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.text()).toBe('');
  });

  it('should reject a path outside the accepted shape', async () => {
    const response = await proxy.serve({
      path: 'not-a-valid-path',
      session: SessionMappedMock,
      ifNoneMatch: null,
    });

    expect(response.status).toBe(400);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('should serve an already-cached file without touching the origin', async () => {
    await writeCachedFile(POSTER_PATH, OnePixelWebpResponseMock);

    const response = await proxy.serve({
      path: POSTER_PATH,
      session: SessionMappedMock,
      ifNoneMatch: null,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/webp');
    expect(response.headers.get('content-length')).toBe(
      String(OnePixelWebpResponseMock.byteLength),
    );
    expect(response.headers.get('cache-control')).toBe(
      'private, max-age=31536000, immutable',
    );
    expect(response.headers.get('etag')).toBe('"e0d9dd35c5"');
    expect(response.headers.get('cross-origin-resource-policy')).toBe(
      'same-origin',
    );
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      OnePixelWebpResponseMock,
    );
  });

  it('should fetch a miss from the origin, cache it, and serve the next request from disk', async () => {
    const requests: Request[] = [];
    server.use(
      http.get(`${IMAGE_ORIGIN}/${POSTER_PATH}`, ({ request }) => {
        requests.push(request);
        return HttpResponse.arrayBuffer(OnePixelWebpResponseMock.buffer, {
          headers: { 'content-type': 'image/webp' },
        });
      }),
    );

    const first = await proxy.serve({
      path: POSTER_PATH,
      session: SessionMappedMock,
      ifNoneMatch: null,
    });
    expect(first.status).toBe(200);
    expect(new Uint8Array(await first.arrayBuffer())).toEqual(
      OnePixelWebpResponseMock,
    );

    const written = await readFile(join(dir, POSTER_PATH));
    expect(new Uint8Array(written)).toEqual(OnePixelWebpResponseMock);

    const second = await proxy.serve({
      path: POSTER_PATH,
      session: SessionMappedMock,
      ifNoneMatch: null,
    });
    expect(second.status).toBe(200);

    expect(requests).toHaveLength(1);
  });

  it('should negative-cache a Trakt 404 and skip the origin on the next request', async () => {
    const requests: Request[] = [];
    server.use(
      http.get(`${IMAGE_ORIGIN}/${POSTER_PATH}`, ({ request }) => {
        requests.push(request);
        return new HttpResponse(null, { status: 404 });
      }),
    );

    const first = await proxy.serve({
      path: POSTER_PATH,
      session: SessionMappedMock,
      ifNoneMatch: null,
    });
    expect(first.status).toBe(404);
    expect(first.headers.get('cache-control')).toBe('private, max-age=3600');

    const second = await proxy.serve({
      path: POSTER_PATH,
      session: SessionMappedMock,
      ifNoneMatch: null,
    });
    expect(second.status).toBe(404);
    expect(second.headers.get('cache-control')).toBe(
      first.headers.get('cache-control'),
    );

    expect(requests).toHaveLength(1);
  });

  it('should return 502 when the origin refuses the request', async () => {
    server.use(
      http.get(
        `${IMAGE_ORIGIN}/${POSTER_PATH}`,
        () => new HttpResponse(null, { status: 403 }),
      ),
    );

    const response = await proxy.serve({
      path: POSTER_PATH,
      session: SessionMappedMock,
      ifNoneMatch: null,
    });

    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toBe('no-store');
    // The warning throttle outlives a test; no other case warns for a 4xx.
    expect(warn).toHaveBeenCalledWith(
      `image proxy: origin 403 for ${POSTER_PATH}`,
    );
  });

  it('should return 502 for a 206 partial image instead of caching it', async () => {
    server.use(
      http.get(
        `${IMAGE_ORIGIN}/${POSTER_PATH}`,
        () =>
          HttpResponse.arrayBuffer(OnePixelWebpResponseMock.buffer, {
            status: 206,
            headers: { 'content-type': 'image/webp' },
          }),
      ),
    );

    const response = await proxy.serve({
      path: POSTER_PATH,
      session: SessionMappedMock,
      ifNoneMatch: null,
    });

    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await readdir(dir)).toEqual([]);
  });

  it('should return 504 when the origin fetch fails outright', async () => {
    server.use(
      http.get(`${IMAGE_ORIGIN}/${POSTER_PATH}`, () => HttpResponse.error()),
    );

    const response = await proxy.serve({
      path: POSTER_PATH,
      session: SessionMappedMock,
      ifNoneMatch: null,
    });

    expect(response.status).toBe(504);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('should answer 304 for a matching If-None-Match without touching the disk', async () => {
    const response = await proxy.serve({
      path: POSTER_PATH,
      session: SessionMappedMock,
      ifNoneMatch: '"e0d9dd35c5"',
    });

    expect(response.status).toBe(304);
    expect(response.headers.get('etag')).toBe('"e0d9dd35c5"');
    expect(response.headers.get('cache-control')).toBe(
      'private, max-age=31536000, immutable',
    );
    expect(await response.text()).toBe('');
  });

  it('should serve a bare-dot avatar path as image/jpeg sniffed from its bytes', async () => {
    await writeCachedFile(avatarBareDotPath, jpegBytes);

    const response = await proxy.serve({
      path: avatarBareDotPath,
      session: SessionMappedMock,
      ifNoneMatch: null,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/jpeg');
  });

  it('should coalesce concurrent misses for the same path into a single origin fetch', async () => {
    const requests: Request[] = [];
    server.use(
      http.get(`${IMAGE_ORIGIN}/${POSTER_PATH}`, ({ request }) => {
        requests.push(request);
        return HttpResponse.arrayBuffer(OnePixelWebpResponseMock.buffer, {
          headers: { 'content-type': 'image/webp' },
        });
      }),
    );

    const responses = await Promise.all([
      proxy.serve({
        path: POSTER_PATH,
        session: SessionMappedMock,
        ifNoneMatch: null,
      }),
      proxy.serve({
        path: POSTER_PATH,
        session: SessionMappedMock,
        ifNoneMatch: null,
      }),
      proxy.serve({
        path: POSTER_PATH,
        session: SessionMappedMock,
        ifNoneMatch: null,
      }),
    ]);

    responses.forEach((response) => expect(response.status).toBe(200));
    await Promise.all(responses.map((response) => response.arrayBuffer()));

    expect(requests).toHaveLength(1);
  });

  it('should not hold the process open while waiting on the origin', async () => {
    const held = holdRequest({
      method: 'get',
      url: `${IMAGE_ORIGIN}/${POSTER_PATH}`,
      answer: () => new HttpResponse(null, { status: 404 }),
    });
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const pending = proxy.serve({
      path: POSTER_PATH,
      session: SessionMappedMock,
      ifNoneMatch: null,
    });

    try {
      await held.requested;
      const timeouts = setTimeoutSpy.mock.calls
        .map(([, delay], index) => ({
          delay,
          timer: setTimeoutSpy.mock.results.at(index)?.value,
        }))
        .filter(({ delay }) => delay === FETCH_TIMEOUT_MS);
      const holdsProcess = timeouts.map(({ timer }) => timer.hasRef());

      expect(holdsProcess).toEqual([false]);
    } finally {
      held.release();
      await pending;
      setTimeoutSpy.mockRestore();
    }
  });

  describe('when the origin stalls', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    // Advances the clock only once the request reaches the origin, after the cache lookup's real disk I/O.
    async function serveAfterTimeout(
      respond: (request: Request) => Promise<Response> | Response,
    ): Promise<{ settledEarly: boolean; response: Response }> {
      const arrived = holdRequest({
        method: 'get',
        url: `${IMAGE_ORIGIN}/${POSTER_PATH}`,
        answer: ({ request }) => respond(request),
      });
      arrived.release();

      const pending = proxy.serve({
        path: POSTER_PATH,
        session: SessionMappedMock,
        ifNoneMatch: null,
      });
      const settled = pending.then(() => true);
      await arrived.requested;

      await vi.advanceTimersByTimeAsync(FETCH_TIMEOUT_MS - 1);
      // Both already settled: race picks the first in order, so true wins if the response is out.
      const settledEarly = await Promise.race([
        settled,
        Promise.resolve(false),
      ]);
      await vi.advanceTimersByTimeAsync(1);

      return { settledEarly, response: await pending };
    }

    it('should return 504 once the timeout elapses when the origin never answers', async () => {
      const { settledEarly, response } = await serveAfterTimeout(
        () => new Promise(() => {}),
      );

      expect(settledEarly).toBe(false);
      expect(response.status).toBe(504);
      expect(response.headers.get('cache-control')).toBe('no-store');
    });

    it('should return 504 once the timeout elapses when the origin body stalls', async () => {
      const { settledEarly, response } = await serveAfterTimeout((request) =>
        new HttpResponse(stalledStream(request.signal), {
          headers: { 'content-type': 'image/webp' },
        })
      );

      expect(settledEarly).toBe(false);
      expect(response.status).toBe(504);
      expect(response.headers.get('cache-control')).toBe('no-store');
    });

    it('should abort the origin request with a TimeoutError', async () => {
      const signals: AbortSignal[] = [];
      await serveAfterTimeout((request) => {
        signals.push(request.signal);
        return new Promise(() => {});
      });

      expect(signals.at(0)?.reason).toBeInstanceOf(DOMException);
      expect(signals.at(0)?.reason?.name).toBe('TimeoutError');
    });

    it('should cache nothing after a timeout and send the next request to the origin', async () => {
      const { response } = await serveAfterTimeout(() => new Promise(() => {}));
      expect(response.status).toBe(504);
      expect(await readdir(dir)).toEqual([]);

      const requests: Request[] = [];
      server.use(
        http.get(`${IMAGE_ORIGIN}/${POSTER_PATH}`, ({ request }) => {
          requests.push(request);
          return HttpResponse.arrayBuffer(OnePixelWebpResponseMock.buffer, {
            headers: { 'content-type': 'image/webp' },
          });
        }),
      );

      const next = await proxy.serve({
        path: POSTER_PATH,
        session: SessionMappedMock,
        ifNoneMatch: null,
      });

      expect(next.status).toBe(200);
      expect(requests).toHaveLength(1);
    });
  });

  it('should return 504 when reading the origin body fails', async () => {
    server.use(
      http.get(
        `${IMAGE_ORIGIN}/${POSTER_PATH}`,
        () =>
          new HttpResponse(brokenStream(), {
            headers: { 'content-type': 'image/webp' },
          }),
      ),
    );

    const response = await proxy.serve({
      path: POSTER_PATH,
      session: SessionMappedMock,
      ifNoneMatch: null,
    });

    expect(response.status).toBe(504);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('should return 502 when writing the fetched bytes to the cache fails', async () => {
    // Pre-create a plain file where the cache needs a directory, so `mkdir` fails.
    await writeFile(join(dir, 'movies'), new Uint8Array(0));

    const response = await proxy.serve({
      path: POSTER_PATH,
      session: SessionMappedMock,
      ifNoneMatch: null,
    });

    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('should reject a non-image content-type without reading the body', async () => {
    server.use(
      http.get(
        `${IMAGE_ORIGIN}/${POSTER_PATH}`,
        () =>
          new HttpResponse(brokenStream(), {
            headers: { 'content-type': 'text/html' },
          }),
      ),
    );

    const response = await proxy.serve({
      path: POSTER_PATH,
      session: SessionMappedMock,
      ifNoneMatch: null,
    });

    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('should reject a content-length over the cap without reading the body', async () => {
    server.use(
      http.get(
        `${IMAGE_ORIGIN}/${POSTER_PATH}`,
        () =>
          new HttpResponse(brokenStream(), {
            headers: {
              'content-type': 'image/webp',
              'content-length': String(MAX_BODY_BYTES + 1),
            },
          }),
      ),
    );

    const response = await proxy.serve({
      path: POSTER_PATH,
      session: SessionMappedMock,
      ifNoneMatch: null,
    });

    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('should reject a chunked body once it runs over the cap, with no content-length', async () => {
    server.use(
      http.get(
        `${IMAGE_ORIGIN}/${POSTER_PATH}`,
        () =>
          new HttpResponse(oversizeChunkedStream(), {
            headers: { 'content-type': 'image/webp' },
          }),
      ),
    );

    const response = await proxy.serve({
      path: POSTER_PATH,
      session: SessionMappedMock,
      ifNoneMatch: null,
    });

    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
