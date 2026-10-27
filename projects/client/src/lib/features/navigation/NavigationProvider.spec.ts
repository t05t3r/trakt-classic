import { afterNavigate, replaceState } from '$app/navigation';
import { page } from '$app/state';
import type { ResolvedPathname } from '$app/types';
import type { AfterNavigate, NavigationType } from '@sveltejs/kit';
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import NavigationProvider from './NavigationProvider.svelte';

const children = createRawSnippet(() => ({
  render: () => '<span>page content</span>',
}));

// page.url narrows its pathname to the app's paths, which a plain URL does not.
function stubPageUrl(pathname: ResolvedPathname, search: string) {
  const url = Object.assign(
    new URL(`${window.location.origin}${pathname}${search}`),
    { pathname },
  );
  const spy = vi.spyOn(page, 'url', 'get').mockReturnValue(url);
  onTestFinished(() => void spy.mockRestore());
}

function navigate(type: NavigationType) {
  render(NavigationProvider, { props: { children } });

  const [onNavigate] = vi.mocked(afterNavigate).mock.calls.at(0) ?? [];

  expect(onNavigate).toBeDefined();
  expect(() => onNavigate?.({ type } as AfterNavigate)).not.toThrow();
}

function expectAddressBar(path: string) {
  const [target, state] = vi.mocked(replaceState).mock.calls.at(0) ?? [];

  expect(replaceState).toHaveBeenCalledOnce();
  expect(target).toBe(page.url);
  expect(target).toHaveProperty('href', `${window.location.origin}${path}`);
  expect(state).toBe(page.state);
}

describe('component: NavigationProvider', () => {
  it('should put the redirect target in the address bar after a history step', () => {
    window.history.replaceState(null, '', '/dashboard');
    stubPageUrl('/', '?returnTo=%2Fdashboard');

    navigate('popstate');

    expectAddressBar('/?returnTo=%2Fdashboard');
  });

  it.each(
    [
      ['brackets', '/foo[x]', ''],
      ['parentheses', '/shows/(x)', ''],
      ['an empty segment', '/a//b', ''],
      ['a URL in the query', '/', '?u=http://x.y/z'],
      ['a leading double slash', '//foo', '?x=1'],
    ] as const,
  )(
    'should put a target with %s in the address bar unchanged',
    (_, pathname, search) => {
      window.history.replaceState(null, '', '/dashboard');
      stubPageUrl(pathname, search);

      navigate('popstate');

      expectAddressBar(`${pathname}${search}`);
    },
  );

  it('should leave the address bar alone when a history step lands where it points', () => {
    window.history.replaceState(null, '', '/?returnTo=%2Fdashboard');

    navigate('popstate');

    expect(replaceState).not.toHaveBeenCalled();
  });

  it('should leave the address bar alone after a navigation that is not a history step', () => {
    window.history.replaceState(null, '', '/dashboard');
    stubPageUrl('/', '?returnTo=%2Fdashboard');

    navigate('link');

    expect(replaceState).not.toHaveBeenCalled();
  });
});
