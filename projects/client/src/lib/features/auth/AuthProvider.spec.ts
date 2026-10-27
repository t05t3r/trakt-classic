import { goto } from '$app/navigation';
import { USER_SETTINGS_URL } from '$mocks/data/users/USER_SETTINGS_URL.ts';
import { server } from '$mocks/server.ts';
import SignedInPage from '$test/beds/auth/SignedInPage.svelte';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { fireEvent, screen } from '@testing-library/svelte';
import { http } from 'msw';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { sessionExpired } from './sessionExpired.ts';

// The test bed mounts AuthProvider around the page it renders.
function renderSignedIn() {
  renderComponent(SignedInPage, { props: {} });
}

// jsdom cannot perform a document load, so the spec watches the calls instead.
function stubLocation() {
  const location = {
    href: window.location.href,
    assign: vi.fn(),
    reload: vi.fn(),
  };
  vi.stubGlobal('location', location);
  onTestFinished(() => void vi.unstubAllGlobals());

  return location;
}

function dispatchPageShow({ persisted }: { persisted: boolean }) {
  window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted }));
}

describe('component: AuthProvider', () => {
  it('should render its children while the user loads', async () => {
    const settings = holdRequest({ method: 'get', url: USER_SETTINGS_URL });
    renderSignedIn();

    await settings.requested;

    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('should replace its children with the error alert when the user fails to load', async () => {
    server.use(http.get(USER_SETTINGS_URL, notFound));
    renderSignedIn();

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent(
      'Your Trakt account could not be loaded. Try again in a moment.',
    );
    expect(screen.queryByText('Calendar')).toBeNull();
  });

  it('should restore its children once a retry loads the user', async () => {
    server.use(http.get(USER_SETTINGS_URL, notFound, { once: true }));
    renderSignedIn();

    await fireEvent.click(
      await screen.findByRole('button', { name: 'Retry' }),
    );

    expect(await screen.findByText('Calendar')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('should load the Login Page with the return path and the expired notice', () => {
    window.history.replaceState(null, '', '/calendar?week=1');
    const location = stubLocation();
    renderSignedIn();

    sessionExpired.next();

    expect(location.assign).toHaveBeenCalledWith(
      '/?returnTo=%2Fcalendar%3Fweek%3D1&error=expired',
    );
    expect(goto).not.toHaveBeenCalled();
  });

  it('should load the Login Page once when several requests find the Session expired', () => {
    const location = stubLocation();
    renderSignedIn();

    sessionExpired.next();
    sessionExpired.next();

    expect(location.assign).toHaveBeenCalledOnce();
  });

  it('should reload a page restored from the back/forward cache after an expiry', () => {
    const location = stubLocation();
    renderSignedIn();

    sessionExpired.next();
    dispatchPageShow({ persisted: true });

    expect(location.reload).toHaveBeenCalledOnce();
  });

  it('should not reload on a pageshow that is not a back/forward cache restore', () => {
    const location = stubLocation();
    renderSignedIn();

    sessionExpired.next();
    dispatchPageShow({ persisted: false });

    expect(location.reload).not.toHaveBeenCalled();
  });

  it('should not reload a page restored from the back/forward cache without an expiry', () => {
    const location = stubLocation();
    renderSignedIn();

    dispatchPageShow({ persisted: true });

    expect(location.reload).not.toHaveBeenCalled();
  });
});
