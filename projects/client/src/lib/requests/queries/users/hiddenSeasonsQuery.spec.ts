import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { HIDE_PROGRESS_URL } from '$mocks/data/users/HIDE_PROGRESS_URL.ts';
import { HiddenSeasonsMappedMock } from '$mocks/data/users/mapped/HiddenSeasonsMappedMock.ts';
import { HiddenSeasonsResponseMock } from '$mocks/data/users/response/HiddenSeasonsResponseMock.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { observeInvalidation } from '$test/beds/query/observeInvalidation.ts';
import { renderSnapshot } from '$test/beds/query/renderSnapshot.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { describe, expect, it } from 'vitest';
import { hiddenSeasonsQuery } from './hiddenSeasonsQuery.ts';

describe('hiddenSeasonsQuery', () => {
  it('should read each season hidden from the watched progress by its show', async () => {
    servePaged({ url: HIDE_PROGRESS_URL, body: HiddenSeasonsResponseMock });
    const { snapshot } = await renderSnapshot(
      hiddenSeasonsQuery(),
      (entries) => entries,
    );

    expect(await readKnown(snapshot)).toEqual(HiddenSeasonsMappedMock);
  });

  it('should ask for the hidden seasons a full page at a time', async () => {
    const searches = recordSearches(HIDE_PROGRESS_URL, []);
    const { snapshot } = await renderSnapshot(
      hiddenSeasonsQuery(),
      (entries) => entries,
    );

    await readKnown(snapshot);

    expect(searches.map((search) => Object.fromEntries(search))).toEqual([
      expect.objectContaining({ type: 'season', page: '1', limit: '250' }),
    ]);
  });

  it('should read again once a season is hidden or unhidden', async () => {
    servePaged({ url: HIDE_PROGRESS_URL, body: HiddenSeasonsResponseMock });
    const invalidate = await observeInvalidation(() =>
      createTestBedInfiniteQuery(hiddenSeasonsQuery())
    );

    expect(await invalidate(InvalidateAction.HideProgress)).toEqual([
      'GET /users/hidden/progress_watched',
    ]);
  });
});
