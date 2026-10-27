import { currentUserFavoritesQuery } from '$lib/features/auth/queries/currentUserFavoritesQuery.ts';
import { useQuery } from '$lib/features/query/useQuery.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { DEVS } from '$mocks/data/media-actions/DEVS.ts';
import { HERETIC } from '$mocks/data/media-actions/HERETIC.ts';
import { MATRIX } from '$mocks/data/media-actions/MATRIX.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';
import { SYNC_FAVORITES_REMOVE_URL } from '$mocks/data/sync/SYNC_FAVORITES_REMOVE_URL.ts';
import { SYNC_FAVORITES_URL } from '$mocks/data/sync/SYNC_FAVORITES_URL.ts';
import { FavoritedMoviesMappedMock } from '$mocks/data/users/mapped/FavoritedMoviesMappedMock.ts';
import { server } from '$mocks/server.ts';
import { createRenderBound } from '$test/beds/media-actions/createRenderBound.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { collectDistinctStates } from '$test/beds/store/collectDistinctStates.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { screen, within } from '@testing-library/svelte';
import { http, HttpResponse } from 'msw';
import { filter, firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { useFavorite } from './useFavorite.ts';

const renderBound = createRenderBound({
  store: useFavorite,
  flag: (store) => store.isFavorite,
  snapshot: (user) => user.favorites,
});

describe('store: useFavorite', () => {
  it('should read a favourite movie from the favourites snapshot', async () => {
    const { isFavorite } = await renderBound(HERETIC);

    expect(await firstValueFrom(isFavorite)).toBe(true);
  });

  it('should read a favourite show from the favourites snapshot', async () => {
    const { isFavorite } = await renderBound(SILO);

    expect(await firstValueFrom(isFavorite)).toBe(true);
  });

  it('should read the date a Target was favourited', async () => {
    const { favoritedAt } = await renderBound(HERETIC);

    expect(await firstValueFrom(favoritedAt)).toEqual(
      assertDefined(
        FavoritedMoviesMappedMock.find(({ item }) => item.id === HERETIC.id),
      ).favoritedAt,
    );
  });

  it('should read no date for a Target off the favourites', async () => {
    const { favoritedAt } = await renderBound(MATRIX);

    expect(await firstValueFrom(favoritedAt)).toBeUndefined();
  });

  it('should show a movie off the favourites as not favourite', async () => {
    const { isFavorite } = await renderBound(MATRIX);

    expect(await firstValueFrom(isFavorite)).toBe(false);
  });

  it('should show the addition while the request is in flight, then settle', async () => {
    const { add, isFavorite, isUpdating } = await renderBound(DEVS);
    const inFlight: unknown[] = [];
    server.use(
      http.post(SYNC_FAVORITES_URL, async ({ request }) => {
        inFlight.push(
          await request.json(),
          await firstValueFrom(isFavorite),
          await firstValueFrom(isUpdating),
        );
        return new HttpResponse(null, { status: 201 });
      }),
    );

    const requests = await captureRequests(() => add());

    expect(inFlight).toEqual([
      { shows: [{ ids: { trakt: DEVS.id } }] },
      true,
      true,
    ]);
    expect(requests).toEqual([
      'POST /sync/favorites',
      'GET /users/me/favorites/movies/rank',
      'GET /users/me/favorites/shows/rank',
    ]);
    expect(await firstValueFrom(isUpdating)).toBe(false);
  });

  it('should show the removal while the request is in flight', async () => {
    const { remove, isFavorite } = await renderBound(HERETIC);
    const inFlight: unknown[] = [];
    server.use(
      http.post(
        SYNC_FAVORITES_REMOVE_URL,
        async ({ request }) => {
          inFlight.push(await request.json(), await firstValueFrom(isFavorite));
          return new HttpResponse(null, { status: 200 });
        },
      ),
    );

    await remove();

    expect(inFlight).toEqual([
      { movies: [{ ids: { trakt: HERETIC.id } }] },
      false,
    ]);
  });

  it('should roll back and show the error toast when the request fails', async () => {
    server.use(
      http.post(
        SYNC_FAVORITES_REMOVE_URL,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    const { remove, isFavorite, isUpdating } = await renderBound(SILO);

    await remove();

    expect(await firstValueFrom(isFavorite)).toBe(true);
    expect(await firstValueFrom(isUpdating)).toBe(false);
    expect(
      within(screen.getByRole('status')).getByText(
        "Couldn't save. Try again.",
      ),
    ).toBeVisible();
  });

  it('should read a Target as not known while the favourites load', async () => {
    holdRequest({
      method: 'get',
      url: 'http://localhost/users/me/favorites/*',
      answer: () => HttpResponse.json([]),
    });
    const { isFavorite } = await renderStore(() => useFavorite(HERETIC));

    expect(await firstValueFrom(isFavorite)).toBeUndefined();
  });

  it('should read a Target as not known when the favourites fail to load', async () => {
    server.use(
      http.get(
        'http://localhost/users/me/favorites/*',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    const { isFavorite, query } = await renderStore(() => ({
      ...useFavorite(HERETIC),
      query: useQuery(currentUserFavoritesQuery()),
    }));
    // A bound read, so it sees the failure rather than a refetch on subscribe.
    const states = collectDistinctStates(isFavorite);
    await firstValueFrom(
      query.pipe(filter((state) => state.isError && !state.isFetching)),
    );

    expect(states.at(-1)).toBeUndefined();
  });
});
