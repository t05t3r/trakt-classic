import { HERETIC } from '$mocks/data/media-actions/HERETIC.ts';
import { MATRIX } from '$mocks/data/media-actions/MATRIX.ts';
import { SILO_SEASON } from '$mocks/data/media-actions/SILO_SEASON.ts';
import { SYNC_RATINGS_REMOVE_URL } from '$mocks/data/sync/SYNC_RATINGS_REMOVE_URL.ts';
import { SYNC_RATINGS_URL } from '$mocks/data/sync/SYNC_RATINGS_URL.ts';
import { server } from '$mocks/server.ts';
import { createRenderBound } from '$test/beds/media-actions/createRenderBound.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { screen, within } from '@testing-library/svelte';
import { http, HttpResponse } from 'msw';
import { filter, firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { useRating } from './useRating.ts';

const renderBound = createRenderBound({
  store: useRating,
  flag: (store) => store.rating,
  snapshot: (user) => user.ratings,
});

describe('store: useRating', () => {
  it('should read the rating from the ratings snapshot', async () => {
    const { rating } = await renderBound(HERETIC);

    expect(
      await firstValueFrom(rating.pipe(filter((value) => value !== null))),
    ).toBe(10);
  });

  it('should show the new rating while the request is in flight, then settle', async () => {
    const { rate, rating, isUpdating } = await renderBound(MATRIX);
    const inFlight: unknown[] = [];
    server.use(
      http.post(SYNC_RATINGS_URL, async ({ request }) => {
        inFlight.push(
          await request.json(),
          await firstValueFrom(rating),
          await firstValueFrom(isUpdating),
        );
        return new HttpResponse(null, { status: 201 });
      }),
    );

    const requests = await captureRequests(() => rate(8));

    expect(inFlight).toEqual([
      { movies: [{ ids: { trakt: MATRIX.id }, rating: 8 }] },
      8,
      true,
    ]);
    expect(requests).toContain('GET /users/me/ratings/movies');
    expect(await firstValueFrom(isUpdating)).toBe(false);
  });

  it('should show no rating while its removal is in flight', async () => {
    const { remove, rating } = await renderBound(HERETIC);
    const inFlight: unknown[] = [];
    server.use(
      http.post(
        SYNC_RATINGS_REMOVE_URL,
        async ({ request }) => {
          inFlight.push(await request.json(), await firstValueFrom(rating));
          return new HttpResponse(null, { status: 200 });
        },
      ),
    );

    await remove();

    expect(inFlight).toEqual([
      { movies: [{ ids: { trakt: HERETIC.id } }] },
      null,
    ]);
  });

  it('should ignore a second equal rating while the first is in flight', async () => {
    const { rate } = await renderBound(MATRIX);
    const bodies: unknown[] = [];
    const held = holdResponse(() => new HttpResponse(null, { status: 201 }));
    server.use(
      http.post(SYNC_RATINGS_URL, async ({ request }) => {
        bodies.push(await request.json());
        return held.answer();
      }),
    );

    const first = rate(8);
    const second = await rate(8);
    held.release();

    expect([await first, second]).toEqual([true, false]);
    expect(bodies).toEqual([
      { movies: [{ ids: { trakt: MATRIX.id }, rating: 8 }] },
    ]);
  });

  it('should post only the last of two different ratings made at once, and show it', async () => {
    const { rate, rating } = await renderBound(MATRIX);
    const bodies: unknown[] = [];
    const held = holdResponse(() => new HttpResponse(null, { status: 201 }));
    server.use(
      http.post(SYNC_RATINGS_URL, async ({ request }) => {
        bodies.push(await request.json());
        return held.answer();
      }),
    );

    const first = rate(8);
    const second = rate(4);
    const whilePosting = await firstValueFrom(rating);
    held.release();

    expect([await first, await second]).toEqual([false, true]);
    expect(whilePosting).toBe(4);
    expect(bodies).toEqual([
      { movies: [{ ids: { trakt: MATRIX.id }, rating: 4 }] },
    ]);
  });

  it('should roll back and show the error toast when the request fails', async () => {
    server.use(
      http.post(
        SYNC_RATINGS_URL,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    const { rate, rating, isUpdating } = await renderBound(HERETIC);

    await rate(3);

    expect(
      await firstValueFrom(rating.pipe(filter((value) => value !== null))),
    ).toBe(10);
    expect(await firstValueFrom(isUpdating)).toBe(false);
    expect(
      within(screen.getByRole('status')).getByText(
        "Couldn't save. Try again.",
      ),
    ).toBeVisible();
  });

  describe('for a season', () => {
    it('should read its rating from the ratings snapshot', async () => {
      const { rating } = await renderBound(SILO_SEASON);

      expect(
        await firstValueFrom(rating.pipe(filter((value) => value !== null))),
      ).toBe(8);
    });

    it('should post a top-level season rating and refetch the season ratings', async () => {
      const { rate } = await renderBound(SILO_SEASON);
      const bodies: unknown[] = [];
      server.use(
        http.post(SYNC_RATINGS_URL, async ({ request }) => {
          bodies.push(await request.json());
          return new HttpResponse(null, { status: 201 });
        }),
      );

      const requests = await captureRequests(() => rate(7));

      expect(bodies).toEqual([
        { seasons: [{ ids: { trakt: SILO_SEASON.id }, rating: 7 }] },
      ]);
      expect(requests).toContain('GET /users/me/ratings/seasons');
    });

    it('should remove a top-level season rating', async () => {
      const { remove } = await renderBound(SILO_SEASON);
      const bodies: unknown[] = [];
      server.use(
        http.post(SYNC_RATINGS_REMOVE_URL, async ({ request }) => {
          bodies.push(await request.json());
          return new HttpResponse(null, { status: 200 });
        }),
      );

      await remove();

      expect(bodies).toEqual([{
        seasons: [{ ids: { trakt: SILO_SEASON.id } }],
      }]);
    });
  });
});
