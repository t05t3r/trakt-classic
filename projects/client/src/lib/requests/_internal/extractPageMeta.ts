import type { PageMeta } from '../models/Paginatable.ts';

const DEFAULT_PAGE = '1';

function parseValue(headerValue: string | null): number {
  const parsed = parseInt(headerValue ?? DEFAULT_PAGE);
  const value = isNaN(parsed) ? parseInt(DEFAULT_PAGE) : parsed;
  return Math.max(1, value);
}

// Unlike the page values, a count of zero is meaningful, so it is not clamped.
function parseItemCount(headerValue: string | null): number | undefined {
  const parsed = parseInt(headerValue ?? '');
  return isNaN(parsed) ? undefined : parsed;
}

export function extractPageMeta(headers: Headers): PageMeta {
  const pageCountHeader = headers.get('x-pagination-page-count');

  if (pageCountHeader === null) {
    return {
      type: 'infinite',
      current: 1,
    };
  }

  const current = parseValue(headers.get('x-pagination-page'));
  const total = parseValue(pageCountHeader);

  return {
    type: 'paginated',
    current: Math.min(current, total),
    total,
    itemCount: parseItemCount(headers.get('x-pagination-item-count')),
  };
}
