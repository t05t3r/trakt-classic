import { USER_SETTINGS_URL } from '$mocks/data/users/USER_SETTINGS_URL.ts';
import { EarlyRatingsUserSettingsResponseMock } from '$mocks/data/users/response/EarlyRatingsUserSettingsResponseMock.ts';
import { server } from '$mocks/server.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { http, HttpResponse } from 'msw';
import { firstValueFrom, map } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { useDisplayEarlyRatings } from './useDisplayEarlyRatings.ts';
import { useUser } from './useUser.ts';

// Reads the flag once the settings response has landed.
async function readSettled() {
  const { displayEarlyRatings, user } = await renderStore(() => ({
    displayEarlyRatings: useDisplayEarlyRatings(),
    user: useUser().user.pipe(map(($user) => $user.data)),
  }));
  await readKnown(user);

  return firstValueFrom(displayEarlyRatings);
}

describe('store: useDisplayEarlyRatings', () => {
  it('should read true for a user who displays early ratings', async () => {
    server.use(
      http.get(
        USER_SETTINGS_URL,
        () => HttpResponse.json(EarlyRatingsUserSettingsResponseMock),
      ),
    );

    expect(await readSettled()).toBe(true);
  });

  it('should read false for a user who does not display early ratings', async () => {
    expect(await readSettled()).toBe(false);
  });

  it('should read false while the user loads', async () => {
    const settings = holdRequest({
      method: 'get',
      url: USER_SETTINGS_URL,
      answer: () => HttpResponse.json(EarlyRatingsUserSettingsResponseMock),
    });
    const displayEarlyRatings = await renderStore(useDisplayEarlyRatings);

    await settings.requested;

    expect(await firstValueFrom(displayEarlyRatings)).toBe(false);
  });
});
