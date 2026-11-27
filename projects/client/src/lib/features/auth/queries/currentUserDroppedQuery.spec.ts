import { MAX_PAGE_LIMIT } from '$lib/requests/MAX_PAGE_LIMIT.ts';
import { DROPPED_URL } from '$mocks/data/users/DROPPED_URL.ts';
import { renderSnapshot } from '$test/beds/query/renderSnapshot.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { describe, expect, it } from 'vitest';
import { currentUserDroppedQuery } from './currentUserDroppedQuery.ts';

describe('currentUserDroppedQuery', () => {
  it('should read the dropped shows 250 to a page', async () => {
    const searches = recordSearches(DROPPED_URL, []);
    const { snapshot } = await renderSnapshot(
      currentUserDroppedQuery(),
      (entries) => entries,
    );

    await readKnown(snapshot);

    expect(searches.map((search) => search.get('limit')))
      .toEqual([String(MAX_PAGE_LIMIT)]);
  });
});
