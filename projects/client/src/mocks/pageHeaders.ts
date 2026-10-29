export type PageHeadersParams = {
  page?: number;
  pageCount?: number;
  itemCount?: number;
};

export function pageHeaders(
  { page = 1, pageCount = 1, itemCount }: PageHeadersParams = {},
): Record<string, string> {
  const headers = {
    'x-pagination-page': String(page),
    'x-pagination-page-count': String(pageCount),
  };

  return itemCount === undefined
    ? headers
    : { ...headers, 'x-pagination-item-count': String(itemCount) };
}
