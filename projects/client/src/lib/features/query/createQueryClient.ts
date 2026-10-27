import { QueryClient } from '@tanstack/query-core';
import { FetchError } from './_internal/FetchError.ts';
import { NetworkError } from './_internal/NetworkError.ts';

const MAX_RETRIES = 3;

type CreateQueryClientProps = {
  retryDelay?: number;
};

function isServerError(error: Error): boolean {
  return error instanceof FetchError &&
    error.detail.status >= 500 && error.detail.status < 600;
}

function shouldRetry(failureCount: number, error: Error): boolean {
  if (failureCount >= MAX_RETRIES) return false;

  return isServerError(error) || error instanceof NetworkError;
}

export function createQueryClient(
  { retryDelay }: CreateQueryClientProps = {},
): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        // All-pages queries would re-pull every page on each tab return.
        refetchOnWindowFocus: false,
        ...(retryDelay !== undefined && { retryDelay }),
      },
    },
  });
}
