import { hasAuthSession } from '$lib/features/auth/hasAuthSession.ts';
import type { Session } from '$lib/features/auth/models/Session.ts';
import { createWarnOnce } from '$lib/utils/console/createWarnOnce.ts';
import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import { time } from '$lib/utils/timing/time.ts';
import type { createImageCache } from '../createImageCache.ts';
import { isImagePath } from '../isImagePath.ts';

type ImageCache = ReturnType<typeof createImageCache>;
type CacheEntry = NonNullable<Awaited<ReturnType<ImageCache['hit']>>>;

type ServeImageParams = {
  path: string;
  session: Session | Nil;
  ifNoneMatch: string | Nil;
  cache: ImageCache;
  imageOrigin: string;
  userAgent: string;
};

const FETCH_TIMEOUT_MS = time.seconds(10);
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const WARN_WINDOW_MS = time.minutes(1);

const HIT_CACHE_CONTROL = 'private, max-age=31536000, immutable';

// One console.warn per status class per minute, so a Trakt IP block doesn't spam the log.
const warnOnce = createWarnOnce({ windowMs: WARN_WINDOW_MS });

function statusClass(status: number): string {
  return `${Math.floor(status / 100)}xx`;
}

function etagFor(path: string): string {
  const filename = path.split('/').at(-1) ?? '';
  return `"${filename.split('.').at(0) ?? ''}"`;
}

function emptyResponse(
  status: number,
  headers: Record<string, string>,
): Response {
  return new Response(null, { status, headers });
}

function entryResponse(entry: CacheEntry, path: string): Response {
  return new Response(entry.body, {
    status: 200,
    headers: {
      'content-type': entry.contentType,
      'content-length': String(entry.contentLength),
      'cache-control': HIT_CACHE_CONTROL,
      etag: etagFor(path),
      'cross-origin-resource-policy': 'same-origin',
      'x-content-type-options': 'nosniff',
    },
  });
}

function negativeResponse(ttlMs: number): Response {
  const maxAge = Math.max(1, Math.ceil(ttlMs / 1000));
  return emptyResponse(404, { 'cache-control': `private, max-age=${maxAge}` });
}

type MissParams = {
  path: string;
  cache: ImageCache;
  imageOrigin: string;
  userAgent: string;
};

type OriginParams = MissParams & { signal: AbortSignal };

function fetchFromOrigin(
  { path, imageOrigin, userAgent, signal }: Omit<OriginParams, 'cache'>,
): Promise<Response> {
  return fetch(`${imageOrigin}/${path}`, {
    signal,
    redirect: 'follow',
    headers: { accept: 'image/webp,image/*', 'user-agent': userAgent },
  });
}

type OriginOutcome =
  | { kind: 'written' }
  | { kind: 'negative'; ttlMs: number }
  | { kind: 'error'; status: 502 | 504 };

type BodyRead =
  | { kind: 'read'; bytes: Uint8Array }
  | { kind: 'oversize' }
  | { kind: 'failed' };

// Reads the body with a running byte count so an oversize response (chunked, no content-length) is cancelled instead of buffered.
async function readBoundedBody(
  body: ReadableStream<Uint8Array> | null,
): Promise<BodyRead> {
  if (!body) return { kind: 'read', bytes: new Uint8Array(0) };

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      return { kind: 'oversize' };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  chunks.reduce((offset, chunk) => {
    bytes.set(chunk, offset);
    return offset + chunk.byteLength;
  }, 0);

  return { kind: 'read', bytes };
}

async function storeFromOrigin(
  { path, cache, imageOrigin, userAgent, signal }: OriginParams,
): Promise<OriginOutcome> {
  const originResponse = await fetchFromOrigin({
    path,
    imageOrigin,
    userAgent,
    signal,
  }).catch(() => undefined);
  if (!originResponse) {
    warnOnce('timeout', `image proxy: origin fetch failed for ${path}`);
    return { kind: 'error', status: 504 };
  }

  if (originResponse.status === 404) {
    // cancel() rejects on an already-errored body; unhandled, that would kill the process.
    originResponse.body?.cancel().catch(NOOP_FN);
    const ttlMs = cache.markNegative(path);
    return { kind: 'negative', ttlMs };
  }

  // Only a full 200 body is cacheable: a 204 or 206 would be stored immutable as an empty or partial file.
  if (originResponse.status !== 200) {
    originResponse.body?.cancel().catch(NOOP_FN);
    warnOnce(
      statusClass(originResponse.status),
      `image proxy: origin ${originResponse.status} for ${path}`,
    );
    return { kind: 'error', status: 502 };
  }

  const contentType = originResponse.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) {
    originResponse.body?.cancel().catch(NOOP_FN);
    warnOnce('invalid-body', `image proxy: invalid content-type for ${path}`);
    return { kind: 'error', status: 502 };
  }

  const contentLength = Number(originResponse.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    originResponse.body?.cancel().catch(NOOP_FN);
    warnOnce('invalid-body', `image proxy: oversize body for ${path}`);
    return { kind: 'error', status: 502 };
  }

  const body = await readBoundedBody(originResponse.body).catch(
    (): BodyRead => ({ kind: 'failed' }),
  );
  if (body.kind === 'failed') {
    warnOnce('timeout', `image proxy: body read failed for ${path}`);
    return { kind: 'error', status: 504 };
  }

  if (body.kind === 'oversize') {
    warnOnce('invalid-body', `image proxy: oversize body for ${path}`);
    return { kind: 'error', status: 502 };
  }

  try {
    await cache.write(path, body.bytes);
  } catch {
    warnOnce('write', `image proxy: cache write failed for ${path}`);
    return { kind: 'error', status: 502 };
  }

  return { kind: 'written' };
}

// setTimeout, not AbortSignal.timeout: fake timers drive only the former.
async function storeFromOriginWithinTimeout(
  params: MissParams,
): Promise<OriginOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(
    () =>
      controller.abort(
        new DOMException(
          'The operation was aborted due to timeout',
          'TimeoutError',
        ),
      ),
    FETCH_TIMEOUT_MS,
  );
  // A stalled origin must not delay shutdown.
  timer.unref();

  try {
    return await storeFromOrigin({ ...params, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function handleMiss(
  { path, cache, imageOrigin, userAgent }: MissParams,
): Promise<Response> {
  const outcome = await cache.coalesce(
    path,
    () => storeFromOriginWithinTimeout({ path, cache, imageOrigin, userAgent }),
  );

  if (outcome.kind === 'negative') return negativeResponse(outcome.ttlMs);
  if (outcome.kind === 'error') {
    return emptyResponse(outcome.status, { 'cache-control': 'no-store' });
  }

  const entry = await cache.hit(path);
  if (!entry) return emptyResponse(502, { 'cache-control': 'no-store' });

  return entryResponse(entry, path);
}

export async function serveImage(
  { path, session, ifNoneMatch, cache, imageOrigin, userAgent }:
    ServeImageParams,
): Promise<Response> {
  if (!hasAuthSession(session)) {
    return emptyResponse(401, { 'cache-control': 'no-store' });
  }

  if (!isImagePath(path)) {
    return emptyResponse(400, { 'cache-control': 'no-store' });
  }

  const etag = etagFor(path);
  if (ifNoneMatch === etag) {
    return emptyResponse(304, { etag, 'cache-control': HIT_CACHE_CONTROL });
  }

  const hit = await cache.hit(path);
  if (hit) return entryResponse(hit, path);

  const remainingTtlMs = cache.negativeHit(path);
  if (remainingTtlMs !== undefined) return negativeResponse(remainingTtlMs);

  return handleMiss({ path, cache, imageOrigin, userAgent });
}
