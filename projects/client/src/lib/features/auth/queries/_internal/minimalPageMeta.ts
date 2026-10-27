import { extractPageMeta } from '$lib/requests/_internal/extractPageMeta.ts';
import type { PageMeta } from '$lib/requests/models/Paginatable.ts';

type MinimalPageMetaParams = {
  headers: Headers;
  entryCount: number;
  page: number;
  limit: number;
};

// Trakt's minimal watched pages carry no page headers but fill up to the limit, so a short page is the last.
export function minimalPageMeta(
  { headers, entryCount, page, limit }: MinimalPageMetaParams,
): PageMeta {
  const meta = extractPageMeta(headers);
  if (meta.type === 'paginated') return meta;
  if (entryCount >= limit) return meta;

  return { type: 'paginated', current: page, total: page };
}
