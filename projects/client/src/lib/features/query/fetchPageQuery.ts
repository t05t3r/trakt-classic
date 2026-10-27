import type { CreateQueryOptions } from '$lib/features/query/QueryOptions.ts';
import { error, type NumericRange } from '@sveltejs/kit';
import type { QueryClient } from '@tanstack/query-core';
import { FetchError } from './_internal/FetchError.ts';

type ErrorStatus = NumericRange<400, 599>;

type FetchPageQueryParams<TOutput, TError extends Error> = {
  queryClient: QueryClient;
  query: CreateQueryOptions<TOutput, TError>;
};

const FALLBACK_STATUS: ErrorStatus = 500;

function isErrorStatus(status: number): status is ErrorStatus {
  return status >= 400 && status <= 599;
}

function toErrorStatus(failure: unknown): ErrorStatus {
  if (!(failure instanceof FetchError)) return FALLBACK_STATUS;

  const status = failure.detail.status;
  return isErrorStatus(status) ? status : FALLBACK_STATUS;
}

async function queryOrFail<TOutput, TError extends Error>(
  { queryClient, query }: FetchPageQueryParams<TOutput, TError>,
): Promise<TOutput> {
  try {
    // A page load must fail offline rather than wait for a reconnect.
    return await queryClient.query({ ...query, networkMode: 'always' });
  } catch (failure) {
    error(toErrorStatus(failure));
  }
}

export async function fetchPageQuery<TOutput, TError extends Error>(
  params: FetchPageQueryParams<TOutput, TError>,
): Promise<void> {
  const data = await queryOrFail(params);
  if (data != null) return;

  // An answer with no body leaves nothing to render, and a cached one would 404 the next load.
  params.queryClient.removeQueries({
    queryKey: params.query.queryKey,
    exact: true,
  });
  error(404);
}
