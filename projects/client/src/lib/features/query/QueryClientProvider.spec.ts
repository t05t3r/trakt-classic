import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { type ApiParams, rawApiFetch } from '$lib/requests/api.ts';
import { server } from '$mocks/server.ts';
import { setNetwork } from '$test/beds/network/setNetwork.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import type { QueryObserverResult } from '@tanstack/query-core';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const PATH = '/query-client/resumable';

const resumableQuery = defineQuery({
  key: 'queryClientResumable',
  invalidations: [],
  dependencies: [],
  request: async ({ fetch }: ApiParams) => {
    const response = await rawApiFetch({ fetch, path: PATH });
    return {
      status: response.status,
      body: await response.json(),
    };
  },
  mapper: (response: { body: string }) => response.body,
  schema: z.string(),
  ttl: null,
});

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
}

function serveStatuses(
  statuses: number[],
  onServe?: (status: number) => void,
) {
  server.use(
    http.get(`http://localhost${PATH}`, () => {
      const status = statuses.shift() ?? 500;
      onServe?.(status);
      return HttpResponse.json('resumed', { status });
    }),
  );
}

function observeUntilPaused() {
  const results: QueryObserverResult<string, Error>[] = [];
  const paused = runQuery<QueryObserverResult<string, Error>>({
    factory: () => createTestBedQuery(resumableQuery()),
    waitFor: (result) => {
      results.push(result);
      return result.fetchStatus === 'paused';
    },
  });

  return { paused, latest: () => results.at(-1) };
}

describe('QueryClientProvider', () => {
  afterEach(() => {
    Reflect.deleteProperty(document, 'visibilityState');
    setNetwork('online');
  });

  it('should resume a retry paused in a hidden tab once the tab is visible', async () => {
    const statuses = [500, 200];
    serveStatuses(statuses);
    setVisibility('hidden');

    const { paused, latest } = observeUntilPaused();
    await paused;
    expect(statuses).toEqual([200]);

    setVisibility('visible');

    await vi.waitFor(() => expect(latest()?.data).toBe('resumed'));
    expect(latest()?.fetchStatus).toBe('idle');
    expect(statuses).toEqual([]);
  });

  it('should resume a retry paused offline once the browser is online', async () => {
    const statuses = [500, 200];
    serveStatuses(statuses, (status) => {
      if (status === 500) setNetwork('offline');
    });

    const { paused, latest } = observeUntilPaused();
    await paused;
    expect(statuses).toEqual([200]);

    setNetwork('online');

    await vi.waitFor(() => expect(latest()?.data).toBe('resumed'));
    expect(latest()?.fetchStatus).toBe('idle');
    expect(statuses).toEqual([]);
  });
});
