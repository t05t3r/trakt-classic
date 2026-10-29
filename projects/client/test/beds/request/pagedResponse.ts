import { pageHeaders, type PageHeadersParams } from '$mocks/pageHeaders.ts';
import { HttpResponse, type JsonBodyType } from 'msw';

export type PagedResponseParams = PageHeadersParams & { body: JsonBodyType };

export function pagedResponse(
  { body, ...meta }: PagedResponseParams,
): Response {
  return HttpResponse.json(body, { headers: pageHeaders(meta) });
}
