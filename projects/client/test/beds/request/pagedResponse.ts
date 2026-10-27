import { HttpResponse, type JsonBodyType } from 'msw';

export type PagedResponseParams = {
  body: JsonBodyType;
  page?: number;
  pageCount?: number;
  itemCount?: number;
};

export function pagedResponse(
  { body, page = 1, pageCount = 1, itemCount }: PagedResponseParams,
): Response {
  const headers = {
    'x-pagination-page': String(page),
    'x-pagination-page-count': String(pageCount),
  };

  return HttpResponse.json(body, {
    headers: itemCount === undefined
      ? headers
      : { ...headers, 'x-pagination-item-count': String(itemCount) },
  });
}
