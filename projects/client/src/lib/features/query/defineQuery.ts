import type { ApiParams } from '$lib/requests/api.ts';
import { getMarker } from '$lib/utils/date/marker.ts';
import { monitor } from '$lib/utils/perf/monitor.ts';
import type {
  CreateInfiniteQueryOptions,
  CreateQueryOptions,
} from '$lib/features/query/QueryOptions.ts';
import type { InfiniteData, QueryKey } from '@tanstack/query-core';
import { type z, type ZodType } from 'zod';
import type { InvalidateActionOptions } from '$lib/requests/models/InvalidateAction.ts';
import type { Paginatable } from '$lib/requests/models/Paginatable.ts';
import { checksum } from '$lib/utils/string/checksum.ts';
import { buildCommonOptions } from './_internal/buildCommonOptions.ts';
import { buildQueryKeys } from './_internal/buildQueryKeys.ts';
import { createMarkerFetch } from './_internal/createMarkerFetch.ts';
import { isValidResponse } from './_internal/isValidResponse.ts';
import { schemaId } from './_internal/schemaId.ts';
import { zodToHash } from './_internal/zodToHash.ts';
import type { DefineQueryProps } from './models/DefineQueryProps.ts';

function markerChecksum(
  invalidations: InvalidateActionOptions[],
): string | null {
  if (invalidations.length === 0) return null;

  return checksum(invalidations.map(getMarker).join(':'));
}

function resolveInvalidations<TRequestParams extends ApiParams>(
  invalidations: DefineQueryProps<
    unknown,
    ZodType,
    TRequestParams
  >['invalidations'],
  requestParams: TRequestParams,
): InvalidateActionOptions[] {
  return Array.isArray(invalidations)
    ? invalidations
    : invalidations(requestParams);
}

export function defineQuery<
  TInput,
  TOutput extends ZodType,
  TError extends Error,
  TRequestParams extends ApiParams,
>(
  {
    request,
    mapper,
    schema,
    invalidations,
    ...params
  }: DefineQueryProps<TInput, TOutput, TRequestParams>,
) {
  const hash = schemaId(monitor(zodToHash, `${params.key} hashing`)(schema));

  return (
    requestParams: TRequestParams = {} as TRequestParams,
  ): CreateQueryOptions<z.infer<TOutput>, TError> & {
    execute: () => Promise<z.infer<TOutput> | Nil>;
  } => {
    const resolvedInvalidations = resolveInvalidations(
      invalidations,
      requestParams,
    );
    const queryKey = buildQueryKeys({
      key: params.key,
      dependencies: params.dependencies,
      requestParams,
      hash,
      invalidations: resolvedInvalidations,
    });

    const execute = async (): Promise<z.infer<TOutput> | Nil> => {
      // Get markers in execute to ensure they are up-to-date
      const marker = markerChecksum(resolvedInvalidations);

      const response = await request({
        ...requestParams,
        fetch: createMarkerFetch(marker, requestParams.fetch),
      });
      const isValid = isValidResponse(response, queryKey.at(0));
      return !isValid ? null : mapper(response, requestParams);
    };

    return {
      queryKey,
      queryFn: execute,
      execute,
      ...buildCommonOptions(params, requestParams),
    };
  };
}

type PaginatedRequestParams = ApiParams & { page?: number };

// FIXME: see if we can unify defineQuery and defineInfiniteQuery more
export function defineInfiniteQuery<
  TInput,
  TEntry,
  TOutput extends ZodType<Paginatable<TEntry>>,
  TError extends Error,
  TRequestParams extends PaginatedRequestParams,
>({
  request,
  mapper,
  schema,
  invalidations,
  ...params
}: DefineQueryProps<TInput, TOutput, TRequestParams>) {
  const hash = schemaId(monitor(zodToHash, `${params.key} hashing`)(schema));

  return (
    requestParams: TRequestParams = {} as TRequestParams,
  ): CreateInfiniteQueryOptions<
    z.infer<TOutput>,
    TError,
    InfiniteData<z.infer<TOutput>>,
    QueryKey,
    number
  > => {
    const resolvedInvalidations = resolveInvalidations(
      invalidations,
      requestParams,
    );
    const queryKey = buildQueryKeys({
      key: params.key,
      dependencies: params.dependencies,
      requestParams,
      hash,
      invalidations: resolvedInvalidations,
    });

    return {
      queryKey,
      queryFn: ({ pageParam }: { pageParam: number }) => {
        // Get markers in queryFn to ensure they are up-to-date
        const marker = markerChecksum(resolvedInvalidations);

        return request({
          ...requestParams,
          page: pageParam,
          fetch: createMarkerFetch(marker, requestParams.fetch),
        })
          .then((response) => {
            const isValid = isValidResponse(response, queryKey.at(0));

            if (!isValid) {
              return {
                entries: [],
                page: { type: 'paginated', current: 1, total: 1 },
              } as z.infer<
                TOutput
              >;
            }

            return mapper(response, { ...requestParams, page: pageParam });
          });
      },
      initialPageParam: requestParams.page ?? 1,
      // Pages by the requested page, since a response may lack its page header.
      getNextPageParam: (lastPage, _allPages, lastPageParam) => {
        const { page, entries } = lastPage as Paginatable<TEntry>;
        const hasMore = page.type === 'infinite'
          ? entries.length > 0
          : lastPageParam < page.total;
        return hasMore ? lastPageParam + 1 : undefined;
      },
      ...buildCommonOptions(params, requestParams),
    };
  };
}
