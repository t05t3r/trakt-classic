// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SessionMappedMock } from '$mocks/data/auth/mapped/SessionMappedMock.ts';
import { APP_ORIGIN } from '$mocks/data/images/APP_ORIGIN.ts';
import { AVATAR_PATH } from '$mocks/data/images/AVATAR_PATH.ts';
import { AVATAR_URL } from '$mocks/data/images/AVATAR_URL.ts';
import { IMAGE_ORIGIN } from '$mocks/data/images/IMAGE_ORIGIN.ts';
import { MOVIE_ART_PATH } from '$mocks/data/images/MOVIE_ART_PATH.ts';
import { MOVIE_ART_URL } from '$mocks/data/images/MOVIE_ART_URL.ts';
import { POSTER_PATH } from '$mocks/data/images/POSTER_PATH.ts';
import { OnePixelWebpResponseMock } from '$mocks/data/images/response/OnePixelWebpResponseMock.ts';
import { server } from '$mocks/server.ts';
import { createImageCache } from '$lib/features/image/createImageCache.ts';
import { createImageProxy } from '$lib/features/image/createImageProxy.ts';
import { serveMediaRoot } from '$test/beds/image/serveMediaRoot.ts';
import { mockRequestEvent } from '$test/request/mockRequestEvent.ts';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GET } from './+server.ts';

let dir: string;
let imageProxy: ReturnType<typeof createImageProxy>;

type BuildEventParams = {
  path: string;
  auth: typeof SessionMappedMock | null;
  headers?: Record<string, string>;
};

function buildEvent({ path, auth, headers = {} }: BuildEventParams) {
  const url = new URL(`http://localhost/img/${path}`);
  const event = mockRequestEvent({
    url: url.href,
    request: new Request(url, { headers }),
    locals: { auth, imageProxy },
  });
  return Object.assign(event, {
    params: { path: url.pathname.replace('/img/', '') },
  });
}

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'image-proxy-route-'));
  imageProxy = createImageProxy({
    origin: APP_ORIGIN,
    imageOrigin: IMAGE_ORIGIN,
    cache: createImageCache({ dir, maxBytes: 0, concurrency: 6 }),
  });
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('GET /img/[...path]', () => {
  it('should refuse a request without a Session', async () => {
    const event = buildEvent({ path: POSTER_PATH, auth: null });

    const response = await GET(event);

    expect(response.status).toBe(401);
  });

  it('should serve the path through the Image Proxy it was handed', async () => {
    let originHits = 0;
    server.use(
      http.get(`${IMAGE_ORIGIN}/${POSTER_PATH}`, () => {
        originHits += 1;
        return HttpResponse.arrayBuffer(OnePixelWebpResponseMock.buffer, {
          headers: { 'content-type': 'image/webp' },
        });
      }),
    );

    const event = buildEvent({ path: POSTER_PATH, auth: SessionMappedMock });
    const response = await GET(event);

    expect(response.status).toBe(200);
    expect(originHits).toBe(1);
  });

  it('should pass If-None-Match through so a matching etag answers 304', async () => {
    const event = buildEvent({
      path: POSTER_PATH,
      auth: SessionMappedMock,
      headers: { 'if-none-match': `"${POSTER_PATH}"` },
    });

    const response = await GET(event);

    expect(response.status).toBe(304);
  });

  it('should forward the query to the Image Proxy for an avatar', async () => {
    const urls = serveMediaRoot(
      new Map([[AVATAR_PATH, OnePixelWebpResponseMock]]),
    );

    const event = buildEvent({ path: AVATAR_PATH, auth: SessionMappedMock });
    const response = await GET(event);

    expect(response.status).toBe(200);
    expect(urls).toEqual([AVATAR_URL]);
  });

  it('should pass a movie art path through to the Image Proxy unchanged', async () => {
    const urls = serveMediaRoot(
      new Map([[MOVIE_ART_PATH, OnePixelWebpResponseMock]]),
    );

    const response = await GET(
      buildEvent({ path: MOVIE_ART_PATH, auth: SessionMappedMock }),
    );

    expect(response.status).toBe(200);
    expect(urls).toEqual([MOVIE_ART_URL]);
  });

  it.each([
    ['an avatar with no version', AVATAR_PATH.replace(/\?.*/, '')],
    ['an avatar with an extra parameter', `${AVATAR_PATH}&x=1`],
    ['an art path with a query', `${POSTER_PATH}?v=1754435517`],
    ['a movie art path with a query', `${MOVIE_ART_PATH}?v=1754435517`],
  ])('should answer 400 for %s', async (_, path) => {
    const event = buildEvent({ path, auth: SessionMappedMock });

    const response = await GET(event);

    expect(response.status).toBe(400);
  });
});
