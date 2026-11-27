import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { useInvalidator } from '$lib/features/query/useInvalidator.ts';
import { type ApiParams, rawApiFetch } from '$lib/requests/api.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { time } from '$lib/utils/timing/time.ts';
import { server } from '$mocks/server.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { waitForSuccess } from '$test/beds/query/waitForSuccess.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { failOnce } from '$test/beds/request/failOnce.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, onTestFinished } from 'vitest';
import { z } from 'zod';
import { useQueryClient } from './queryClientContext.ts';
import { rereadWaitingReaders, trackReaderWait } from './readerWaits.ts';

const ACTION = InvalidateAction.Rated('movie');
const PATH = '/reader-waits/reader';
const URL = `http://localhost${PATH}`;

const readerQuery = defineQuery({
  key: 'readerWaitsReader',
  invalidations: [ACTION],
  dependencies: [],
  request: async ({ fetch }: ApiParams) => {
    const response = await rawApiFetch({ fetch, path: PATH });
    return { status: response.status, body: await response.json() };
  },
  mapper: (response: { body: string }) => response.body,
  schema: z.string(),
  ttl: time.minutes(15),
});

async function renderReader() {
  server.use(http.get(URL, () => HttpResponse.json('read')));
  const store = await renderStore(() => ({
    ...useInvalidator(),
    client: useQueryClient(),
    waitForLateRequests: useWaitForLateRequests(),
    reader: createTestBedQuery(readerQuery()),
  }));
  const subscription = store.reader.subscribe();
  onTestFinished(() => subscription.unsubscribe());
  await waitForSuccess(store.reader);
  const cache = store.client.getQueryCache();
  const query = assertDefined(
    cache.find({ queryKey: readerQuery().queryKey, exact: true }),
  );
  const track = () => trackReaderWait(cache, query);
  const reread = () =>
    captureRequests(async () => {
      await rereadWaitingReaders(store.client);
      await store.waitForLateRequests();
    }, { pathIncludes: PATH });

  return { ...store, track, reread };
}

async function renderStaleReader() {
  const store = await renderReader();
  failOnce(URL);
  await store.invalidate(ACTION);
  return store;
}

describe('readerWaits', () => {
  it('should re-read a tracked reader whose last read failed', async () => {
    const { track, reread } = await renderStaleReader();
    track();

    expect(await reread()).toEqual([`GET ${PATH}`]);
  });

  it('should not re-read a tracked reader that is fresh', async () => {
    const { track, reread } = await renderReader();
    track();

    expect(await reread()).toEqual([]);
  });

  it('should not re-read a reader once its wait is released', async () => {
    const { track, reread } = await renderStaleReader();
    const release = track();

    release();

    expect(await reread()).toEqual([]);
  });

  it('should not re-read a stale reader no wait tracks', async () => {
    const { reread } = await renderStaleReader();

    expect(await reread()).toEqual([]);
  });

  it('should join a read already under way instead of sending another', async () => {
    const { track, invalidate, client, reader } = await renderReader();
    track();
    const held = holdRequest({
      method: 'get',
      url: URL,
      answer: () => HttpResponse.json('held'),
    });

    const requests = await captureRequests(async () => {
      const invalidation = invalidate(ACTION);
      await held.requested;
      const rereading = rereadWaitingReaders(client);
      held.release();
      await Promise.all([invalidation, rereading]);
    }, { pathIncludes: PATH });

    expect(requests).toEqual([`GET ${PATH}`]);
    expect((await waitForSuccess(reader)).data).toBe('held');
  });
});
