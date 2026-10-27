import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import { type ApiParams, rawApiFetch } from '$lib/requests/api.ts';
import { server } from '$mocks/server.ts';
import { setNetwork } from '$test/beds/network/setNetwork.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { useWaitForQueryPaused } from '$test/beds/query/useWaitForQueryPaused.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { collectDistinctStates } from '$test/beds/store/collectDistinctStates.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import type { QueryObserverResult } from '@tanstack/query-core';
import { http, HttpResponse } from 'msw';
import {
  filter,
  firstValueFrom,
  map,
  type Observable,
  shareReplay,
} from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineQuery } from './defineQuery.ts';
import { useQueryClient } from './_internal/queryClientContext.ts';
import { toSectionStatus } from './toSectionStatus.ts';

const TitlesSchema = z.array(z.string());

type Titles = z.infer<typeof TitlesSchema>;

type Reading = {
  result: QueryObserverResult<Titles>;
  status: SectionStatus<Titles>;
};

const titlesQuery = (name: string) =>
  defineQuery({
    key: `sectionStatus-${name}`,
    invalidations: [],
    dependencies: [],
    request: async ({ fetch }: ApiParams) => {
      const response = await rawApiFetch({
        fetch,
        path: `/section-status/${name}`,
      });
      return {
        status: response.status,
        body: await response.json().catch(() => undefined),
      };
    },
    mapper: ({ body }) => TitlesSchema.parse(body),
    schema: TitlesSchema,
    ttl: null,
  })();

function serve(name: string, answer: Titles | 'fail') {
  const requests: string[] = [];
  server.use(
    http.get(`http://localhost/section-status/${name}`, () => {
      requests.push(name);
      return answer === 'fail' ? notFound() : HttpResponse.json(answer);
    }),
  );

  return requests;
}

function readSection(name: string) {
  return createTestBedQuery(titlesQuery(name)).pipe(
    map((result) => ({
      result,
      status: toSectionStatus({
        result,
        isEmpty: (titles) => titles.length === 0,
      }),
    })),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}

function watch(readings: Observable<Reading>) {
  const kinds = collectDistinctStates(
    readings.pipe(map(({ status }) => status.kind)),
  );

  const next = (accept: (reading: Reading) => boolean) =>
    firstValueFrom(readings.pipe(filter(accept)));

  return { kinds, next };
}

function retryOf(status: SectionStatus<Titles>) {
  if (status.kind !== 'error') throw new Error(`not an error: ${status.kind}`);
  return status.retry;
}

const isSettled = ({ result }: Reading) => !result.isFetching;

describe('toSectionStatus', () => {
  // Before the test bed unmounts, while the query client still hears it.
  afterEach(() => setNetwork('online'));

  it('should read loading, then ready with the data', async () => {
    serve('ready', ['Severance']);
    const { readings } = await renderStore(() => ({
      readings: readSection('ready'),
    }));
    const { kinds, next } = watch(readings);

    const { status } = await next(isSettled);

    expect(status).toEqual({ kind: 'ready', data: ['Severance'] });
    expect(kinds).toEqual(['loading', 'ready']);
  });

  it('should read empty when the data is empty', async () => {
    serve('empty', []);
    const { readings } = await renderStore(() => ({
      readings: readSection('empty'),
    }));
    const { kinds, next } = watch(readings);

    await next(isSettled);

    expect(kinds).toEqual(['loading', 'empty']);
  });

  it.each([
    [['Severance', 'Hidden'], { kind: 'ready', data: ['Severance'] }],
    [['Hidden'], { kind: 'empty' }],
  ])(
    'should select from %j before judging it empty: %j',
    async (titles, expected) => {
      serve('selected', titles);
      const { readings } = await renderStore(() => ({
        readings: createTestBedQuery(titlesQuery('selected')).pipe(
          map((result) =>
            toSectionStatus({
              result,
              select: (data) => data.filter((title) => title !== 'Hidden'),
              isEmpty: (shown) => shown.length === 0,
            })
          ),
        ),
      }));

      const status = await firstValueFrom(
        readings.pipe(filter(({ kind }) => kind !== 'loading')),
      );

      expect(status).toEqual(expected);
    },
  );

  it.each([
    [['Hidden', 'Severance'], { kind: 'ready', data: 'Severance' }],
    [['Hidden'], { kind: 'empty' }],
  ])(
    'should leave out of the ready data what a type guard judges empty, from %j: %j',
    async (titles, expected) => {
      serve('guarded', titles);
      const { readings } = await renderStore(() => ({
        readings: createTestBedQuery(titlesQuery('guarded')).pipe(
          map((result): SectionStatus<string> =>
            toSectionStatus({
              result,
              select: (data) =>
                data.find((title) => title !== 'Hidden') ?? null,
              isEmpty: (title) => title === null,
            })
          ),
        ),
      }));

      const status = await firstValueFrom(
        readings.pipe(filter(({ kind }) => kind !== 'loading')),
      );

      expect(status).toEqual(expected);
    },
  );

  it('should read error when the first fetch fails', async () => {
    serve('failed', 'fail');
    const { readings } = await renderStore(() => ({
      readings: readSection('failed'),
    }));
    const { kinds, next } = watch(readings);

    await next(isSettled);

    expect(kinds).toEqual(['loading', 'error']);
  });

  it.each([
    [['Severance'], 'ready'],
    [[], 'empty'],
  ])(
    'should keep reading the cached data %j when a refetch fails: %s',
    async (titles, kind) => {
      serve('cached', titles);
      const { readings, client } = await renderStore(() => ({
        readings: readSection('cached'),
        client: useQueryClient(),
      }));
      const { kinds, next } = watch(readings);
      await next(isSettled);

      serve('cached', 'fail');
      await client.refetchQueries();
      const { result, status } = await next(({ result }) =>
        result.status === 'error'
      );

      expect(result.data).toEqual(titles);
      expect(status.kind).toBe(kind);
      expect(kinds).toEqual(['loading', kind]);
    },
  );

  it('should read loading while a first load waits offline', async () => {
    serve('offline', ['Severance']);
    const { readings, waitForQueryPaused } = await renderStore(() => ({
      readings: readSection('offline'),
      waitForQueryPaused: useWaitForQueryPaused(),
    }));
    setNetwork('offline');
    const paused = waitForQueryPaused({
      queryKey: [titlesQuery('offline').queryKey.at(0)],
    });
    const { kinds, next } = watch(readings);

    await paused;
    const { result, status } = await next(({ result }) =>
      result.fetchStatus === 'paused'
    );

    expect(result.status).toBe('pending');
    expect(status).toEqual({ kind: 'loading' });
    expect(kinds).toEqual(['loading']);
  });

  it('should read loading while a retry after a load error runs', async () => {
    serve('retried', 'fail');
    const { readings } = await renderStore(() => ({
      readings: readSection('retried'),
    }));
    const { kinds, next } = watch(readings);
    const { status } = await next(isSettled);

    serve('retried', ['Severance']);
    retryOf(status)();
    await next(({ status }) => status.kind === 'ready');

    expect(kinds).toEqual(['loading', 'error', 'loading', 'ready']);
  });

  it('should refetch only its own query on retry', async () => {
    serve('up-next', 'fail');
    const watchlistRequests = serve('watchlist', 'fail');
    const { upNext, watchlist } = await renderStore(() => ({
      upNext: readSection('up-next'),
      watchlist: readSection('watchlist'),
    }));
    const upNextWatch = watch(upNext);
    const watchlistWatch = watch(watchlist);
    const { status } = await upNextWatch.next(isSettled);
    await watchlistWatch.next(isSettled);

    const upNextRequests = serve('up-next', ['Severance']);
    retryOf(status)();
    await upNextWatch.next(({ status }) => status.kind === 'ready');

    expect(upNextRequests).toEqual(['up-next']);
    expect(watchlistRequests).toEqual(['watchlist']);
    expect(watchlistWatch.kinds).toEqual(['loading', 'error']);
  });
});
