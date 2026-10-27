import { extractPageMeta } from '$lib/requests/_internal/extractPageMeta.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { describe, expect, it } from 'vitest';
import { minimalPageMeta } from './minimalPageMeta.ts';

const HEADERLESS = new Headers();

describe('minimalPageMeta', () => {
  it('should end paging on a headerless page shorter than its limit', () => {
    const meta = minimalPageMeta({
      headers: HEADERLESS,
      entryCount: 3,
      page: 2,
      limit: 10,
    });

    expect(meta).toEqual({ type: 'paginated', current: 2, total: 2 });
  });

  it('should keep paging after a headerless page that fills its limit', () => {
    const meta = minimalPageMeta({
      headers: HEADERLESS,
      entryCount: 10,
      page: 2,
      limit: 10,
    });

    expect(meta.type).toBe('infinite');
  });

  it('should read the page headers when the response has them', () => {
    const { headers } = pagedResponse({ body: [], page: 1, pageCount: 3 });

    const meta = minimalPageMeta({
      headers,
      entryCount: 3,
      page: 1,
      limit: 10,
    });

    expect(meta).toEqual(extractPageMeta(headers));
  });
});
