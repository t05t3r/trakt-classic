// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SessionMappedMock } from '$mocks/data/auth/mapped/SessionMappedMock.ts';
import { APP_ORIGIN } from '$mocks/data/images/APP_ORIGIN.ts';
import { IMAGE_ORIGIN } from '$mocks/data/images/IMAGE_ORIGIN.ts';
import { POSTER_PATH } from '$mocks/data/images/POSTER_PATH.ts';
import { OnePixelWebpResponseMock } from '$mocks/data/images/response/OnePixelWebpResponseMock.ts';
import { server } from '$mocks/server.ts';
import { createImageCache } from '$lib/features/image/createImageCache.ts';
import { createImageProxy } from '$lib/features/image/createImageProxy.ts';
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
  const url = `http://localhost/img/${path}`;
  const event = mockRequestEvent({
    url,
    request: new Request(url, { headers }),
    locals: { auth, imageProxy },
  });
  return Object.assign(event, { params: { path } });
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
      headers: { 'if-none-match': '"e0d9dd35c5"' },
    });

    const response = await GET(event);

    expect(response.status).toBe(304);
  });
});
