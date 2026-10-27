import type { Session } from '$lib/features/auth/models/Session.ts';
import {
  type MockRequestEvent,
  mockRequestEvent,
} from '$test/request/mockRequestEvent.ts';
import { describe, expect, it } from 'vitest';
import { load } from './+layout.server.ts';

type LoadEvent =
  & Parameters<typeof load>[0]
  & Pick<MockRequestEvent, 'trackedUrlReads'>;

type LoadOptions = {
  isDataRequest: boolean;
  auth?: Session | null;
};

const AUTH = { access: 'access', refresh: 'refresh', expiresAt: 1 };

const eventFor = (
  path: string,
  { isDataRequest, auth = null }: LoadOptions,
) => {
  const event = mockRequestEvent({
    url: `http://localhost${path}`,
    locals: { auth, sessionEnded: false },
  });
  return { ...event, isDataRequest } as unknown as LoadEvent;
};

const loadWith = (path: string, options: LoadOptions) =>
  load(eventFor(path, options));

describe('load: app layout', () => {
  describe('for a data request', () => {
    it('should redirect a missing Session to Login Page with the return path', () => {
      expect(() => loadWith('/dashboard', { isDataRequest: true })).toThrow(
        expect.objectContaining({
          status: 307,
          location: '/?returnTo=%2Fdashboard',
        }),
      );
    });

    it('should keep the search in the return path', () => {
      expect(() =>
        loadWith('/shows/silo?actors=guest', { isDataRequest: true })
      ).toThrow(
        expect.objectContaining({
          status: 307,
          location: '/?returnTo=%2Fshows%2Fsilo%3Factors%3Dguest',
        }),
      );
    });

    it('should read no URL property that re-runs it on a client navigation', () => {
      const event = eventFor('/shows/silo?actors=guest', {
        isDataRequest: true,
        auth: AUTH,
      });

      load(event);

      expect(event.trackedUrlReads).toEqual([]);
    });

    it("should pass the Session's token to the browser", () => {
      expect(loadWith('/dashboard', { isDataRequest: true, auth: AUTH }))
        .toEqual({
          auth: { token: 'access', isAuthorized: true },
        });
    });
  });

  describe('for a document request', () => {
    it('should send a signed-in page as private and not to be stored', () => {
      const event = eventFor('/dashboard', {
        isDataRequest: false,
        auth: AUTH,
      });

      load(event);

      expect(event.setHeaders).toHaveBeenCalledExactlyOnceWith({
        'cache-control': 'private, no-store',
      });
    });

    it('should redirect a missing Session before setting any header', () => {
      const event = eventFor('/dashboard', { isDataRequest: false });

      expect(() => load(event)).toThrow(
        expect.objectContaining({ status: 307 }),
      );
      expect(event.setHeaders).not.toHaveBeenCalled();
    });
  });
});
