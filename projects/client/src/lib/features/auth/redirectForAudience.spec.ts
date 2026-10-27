import { isRedirect } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { redirectForAudience } from './redirectForAudience.ts';

const captureRedirect = (params: Parameters<typeof redirectForAudience>[0]) => {
  try {
    redirectForAudience(params);
    return null;
  } catch (error) {
    if (!isRedirect(error)) throw error;
    return { status: error.status, location: error.location };
  }
};

describe('redirectForAudience', () => {
  it('should redirect missing Sessions to Login Page with the exact return path', () => {
    expect(captureRedirect({
      audience: 'authenticated',
      session: null,
      sessionEnded: false,
      pathAndSearch: '/calendar?week=1',
    })).toEqual({ status: 307, location: '/?returnTo=%2Fcalendar%3Fweek%3D1' });
  });

  it('should redirect an ended Session to Login Page with the expired notice', () => {
    expect(captureRedirect({
      audience: 'authenticated',
      session: null,
      sessionEnded: true,
      pathAndSearch: '/calendar?week=1',
    })).toEqual({
      status: 307,
      location: '/?returnTo=%2Fcalendar%3Fweek%3D1&error=expired',
    });
  });

  it('should allow lapsed Sessions through the app gate for reactive refresh', () => {
    expect(captureRedirect({
      audience: 'authenticated',
      session: { access: 'lapsed', refresh: 'refresh', expiresAt: 0 },
      sessionEnded: false,
      pathAndSearch: '/dashboard',
    })).toBeNull();
  });

  describe('for a Session on Login Page', () => {
    const session = { access: 'access', refresh: 'refresh', expiresAt: 1 };

    it('should redirect to the return path', () => {
      expect(captureRedirect({
        audience: 'public',
        session,
        returnTo: '/calendar?week=1',
      })).toEqual({ status: 307, location: '/calendar?week=1' });
    });

    it.each(['/', '/?returnTo=%2Fcalendar', '/auth/login', '/auth/logout'])(
      'should redirect to the dashboard for the return path %s',
      (returnTo) => {
        expect(captureRedirect({ audience: 'public', session, returnTo }))
          .toEqual({ status: 307, location: '/dashboard' });
      },
    );
  });

  it('should let a missing Session stay on Login Page', () => {
    expect(captureRedirect({
      audience: 'public',
      session: null,
      returnTo: '/calendar?week=1',
    })).toBeNull();
  });
});
