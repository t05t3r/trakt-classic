import type { ApiParams } from '$lib/requests/api.ts';
import type { ZodType } from 'zod';
import type { DefineQueryProps } from '../models/DefineQueryProps.ts';

type CommonOptionsProps<TRequestParams extends ApiParams> = Pick<
  DefineQueryProps<unknown, ZodType, TRequestParams>,
  | 'ttl'
  | 'refetchOnWindowFocus'
  | 'refetchInterval'
  | 'retry'
  | 'enabled'
>;

export function buildCommonOptions<TRequestParams extends ApiParams>(
  params: CommonOptionsProps<TRequestParams>,
  requestParams: TRequestParams,
) {
  // An explicit `undefined` would replace the QueryClient's default.
  return {
    ...(params.ttl != null && { staleTime: params.ttl }),
    ...(params.refetchOnWindowFocus !== undefined &&
      { refetchOnWindowFocus: params.refetchOnWindowFocus }),
    ...(params.refetchInterval !== undefined &&
      { refetchInterval: params.refetchInterval }),
    ...(params.retry !== undefined && { retry: params.retry }),
    enabled: params.enabled?.(requestParams) ?? true,
  };
}
