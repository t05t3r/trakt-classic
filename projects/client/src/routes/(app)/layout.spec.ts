import { getToken, setToken } from '$lib/features/auth/token.ts';
import { createQueryClient } from '$lib/features/query/createQueryClient.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { hoverTooltipLines } from '$test/beds/tooltip/hoverTooltipLines.ts';
import LayoutHintHost from '$test/beds/tooltip/LayoutHintHost.svelte';
import { render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import RootLayout from '../+layout.svelte';
import AppLayout from './+layout.svelte';
import { load } from './+layout.ts';

type LoadEvent = Parameters<typeof load>[0];

const loadWith = (token: string | null) =>
  load({ data: { auth: { token, isAuthorized: token != null } } } as LoadEvent);

describe('load: app layout in the browser', () => {
  afterEach(() => setToken(null));

  it("should seed the browser token with the Session's token", () => {
    loadWith('access');

    expect(getToken().value).toBe('access');
  });

  it('should pass the gate data on', () => {
    expect(loadWith('access')).toEqual({
      auth: { token: 'access', isAuthorized: true },
    });
  });
});

describe('component: app layout', () => {
  it('should show the hint of an element on the page', async () => {
    stubClientRects();
    render(LayoutHintHost, {
      props: {
        root: RootLayout,
        app: AppLayout,
        queryClient: createQueryClient(),
      },
    });

    expect(await hoverTooltipLines(await screen.findByText('Page')))
      .toEqual(['The whole page']);
  });
});
