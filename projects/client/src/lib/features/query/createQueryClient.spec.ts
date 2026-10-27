import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { type ApiParams, rawApiFetch } from '$lib/requests/api.ts';
import { server } from '$mocks/server.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import type { QueryObserverResult } from '@tanstack/query-core';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createQueryClient } from './createQueryClient.ts';

type TestQueryProps = {
  path: string;
  mapper?: () => string;
  refetchOnWindowFocus?: boolean;
};

function testQuery(
  { path, mapper = () => 'value', refetchOnWindowFocus }: TestQueryProps,
) {
  return defineQuery({
    key: `queryErrors${path}`,
    invalidations: [],
    dependencies: [],
    request: async ({ fetch }: ApiParams) => {
      const response = await rawApiFetch({ fetch, path });
      return {
        status: response.status,
        body: await response.json().catch(() => undefined),
      };
    },
    mapper,
    schema: z.string(),
    ttl: null,
    refetchOnWindowFocus,
  })();
}

function runUntilError(query: ReturnType<typeof testQuery>) {
  return runQuery<QueryObserverResult<string, Error>>({
    factory: () => createTestBedQuery(query),
    waitFor: (result) => result.status === 'error',
  });
}

async function requestsFor(query: TestQueryProps) {
  const requests = await captureRequests(async () => {
    await runUntilError(testQuery(query));
  });

  return requests.filter((request) => request === `GET ${query.path}`);
}

function failWith(path: string, status: number) {
  server.use(
    http.get(
      `http://localhost${path}`,
      () => new HttpResponse(null, { status }),
    ),
  );
}

describe('createQueryClient', () => {
  describe('window focus', () => {
    it('should not refetch a query on window focus by default', () => {
      const options = createQueryClient().defaultQueryOptions(
        testQuery({ path: '/focus/default' }),
      );

      expect(options.refetchOnWindowFocus).toBe(false);
    });

    it('should keep refetchOnWindowFocus true for a query that asks for it', () => {
      const options = createQueryClient().defaultQueryOptions(
        testQuery({ path: '/focus/opt-in', refetchOnWindowFocus: true }),
      );

      expect(options.refetchOnWindowFocus).toBe(true);
    });
  });

  describe('retries', () => {
    it('should request a 500 four times', async () => {
      failWith('/query-errors/500', 500);

      const requests = await requestsFor({ path: '/query-errors/500' });

      expect(requests).toHaveLength(4);
    });

    it.each([429, 404])('should request a %i once', async (status) => {
      const path = `/query-errors/${status}`;
      failWith(path, status);

      const requests = await requestsFor({ path });

      expect(requests).toHaveLength(1);
    });

    it('should request a network failure four times', async () => {
      server.use(
        http.get(
          'http://localhost/query-errors/network',
          () => HttpResponse.error(),
        ),
      );

      const requests = await requestsFor({ path: '/query-errors/network' });

      expect(requests).toHaveLength(4);
    });

    it('should request once when the mapper throws a TypeError', async () => {
      server.use(
        http.get(
          'http://localhost/query-errors/mapper',
          () => HttpResponse.json('value'),
        ),
      );

      const requests = await requestsFor({
        path: '/query-errors/mapper',
        mapper: () => {
          throw new TypeError('mapper bug');
        },
      });

      expect(requests).toHaveLength(1);
    });
  });
});
