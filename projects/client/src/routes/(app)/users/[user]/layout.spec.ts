import { ExtendedUserSettingsMappedMock } from '$mocks/data/users/mapped/ExtendedUserSettingsMappedMock.ts';
import { httpErrorStatus } from '$test/beds/request/httpErrorStatus.ts';
import { mockLoadEvent } from '$test/beds/request/mockLoadEvent.ts';
import { describe, expect, it } from 'vitest';
import { load } from './+layout.ts';

const SLUG = ExtendedUserSettingsMappedMock.slug;

const eventFor = (path: string) => {
  const url = new URL(path, 'http://localhost');
  const { event } = mockLoadEvent({
    load,
    url: url.href,
    params: { user: url.pathname.split('/').at(2) },
  });

  return event;
};

describe('load: users layout', () => {
  it("should redirect me to the signed-in user's slug, keeping the rest of the path and the search", async () => {
    await expect(load(eventFor('/users/me/lists/watched?sort=rank,asc')))
      .rejects.toMatchObject({
        status: 307,
        location: `/users/${SLUG}/lists/watched?sort=rank,asc`,
      });
  });

  it('should read no URL property that reruns it on a client navigation', async () => {
    const event = eventFor('/users/me/lists?sort=rank,asc');

    await expect(load(event)).rejects.toMatchObject({ status: 307 });

    expect(event.trackedUrlReads).toEqual([]);
  });

  it("should pass the signed-in user's own slug", async () => {
    await expect(load(eventFor(`/users/${SLUG}/lists`))).resolves
      .toBeUndefined();
  });

  it("should raise a 404 for another user's slug", async () => {
    expect(
      await httpErrorStatus(async () => load(eventFor('/users/kim/lists'))),
    )
      .toBe(404);
  });
});
