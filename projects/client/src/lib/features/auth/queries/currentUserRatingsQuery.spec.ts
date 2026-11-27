import { UserRatedMappedMock } from '$mocks/data/users/mapped/UserRatedMappedMock.ts';
import { RATED_SEASONS_URL } from '$mocks/data/users/RATED_SEASONS_URL.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { failOnce } from '$test/beds/request/failOnce.ts';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { currentUserRatingsQuery } from './currentUserRatingsQuery.ts';

const readSettled = () =>
  runQuery({
    factory: () => createTestBedQuery(currentUserRatingsQuery()),
    waitFor: (result) => result.status !== 'pending',
  });

describe('currentUserRatingsQuery', () => {
  it('should read the ratings of every type', async () => {
    const result = await readSettled();

    expect(result.data).toEqual(UserRatedMappedMock);
  });

  it('should fail when only the seasons request fails', async () => {
    failOnce(RATED_SEASONS_URL);

    const result = await readSettled();

    expect(result.status).toBe('error');
    expect(result.data).toBeUndefined();
  });

  it('should retry the seasons request after a server error', async () => {
    failOnce(
      RATED_SEASONS_URL,
      () => new HttpResponse(null, { status: 503 }),
    );

    const result = await readSettled();

    expect(result.data).toEqual(UserRatedMappedMock);
  });
});
