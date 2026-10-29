import { USER_SETTINGS_URL } from '$mocks/data/users/USER_SETTINGS_URL.ts';
import { HideCommentSpoilersUserSettingsResponseMock } from '$mocks/data/users/response/HideCommentSpoilersUserSettingsResponseMock.ts';
import { server } from '$mocks/server.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { readSettled } from '$test/beds/store/readSettled.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { http, HttpResponse } from 'msw';
import { combineLatest, firstValueFrom, map } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { useHideCommentSpoilers } from './useHideCommentSpoilers.ts';
import { useUser } from './useUser.ts';

// Reads the flag once the settings response has landed.
async function readLoaded() {
  const { hideCommentSpoilers, user } = await renderStore(() => ({
    hideCommentSpoilers: useHideCommentSpoilers(),
    user: useUser().user.pipe(map(($user) => $user.data)),
  }));
  await readKnown(user);

  return firstValueFrom(hideCommentSpoilers);
}

describe('store: useHideCommentSpoilers', () => {
  it('should read true for a user who hides comment spoilers', async () => {
    server.use(
      http.get(
        USER_SETTINGS_URL,
        () => HttpResponse.json(HideCommentSpoilersUserSettingsResponseMock),
      ),
    );

    expect(await readLoaded()).toBe(true);
  });

  it('should read false for a user who shows comment spoilers', async () => {
    expect(await readLoaded()).toBe(false);
  });

  it('should read not known while the settings load', async () => {
    const settings = holdRequest({
      method: 'get',
      url: USER_SETTINGS_URL,
      answer: () =>
        HttpResponse.json(HideCommentSpoilersUserSettingsResponseMock),
    });
    const hideCommentSpoilers = await renderStore(useHideCommentSpoilers);

    await settings.requested;

    expect(await firstValueFrom(hideCommentSpoilers)).toBeUndefined();
  });

  it('should read false for a signed-out viewer', async () => {
    holdRequest({
      method: 'get',
      url: USER_SETTINGS_URL,
      answer: () =>
        HttpResponse.json(HideCommentSpoilersUserSettingsResponseMock),
    });
    const hideCommentSpoilers = await renderStore(useHideCommentSpoilers, null);

    expect(await firstValueFrom(hideCommentSpoilers)).toBe(false);
  });

  it('should read false once the settings fail to load', async () => {
    server.use(http.get(USER_SETTINGS_URL, notFound));

    const read = await readSettled(() =>
      combineLatest({
        hideCommentSpoilers: useHideCommentSpoilers(),
        settingsFailed: useUser().user.pipe(map(($user) => $user.isError)),
      })
    );

    expect(read).toEqual({ hideCommentSpoilers: false, settingsFailed: true });
  });
});
