import { getToken, setToken } from '$lib/features/auth/token.ts';
import { createQueryClient } from '$lib/features/query/createQueryClient.ts';
import { isHydrated, setHydrated } from '$lib/utils/hydration/hydration.ts';
import LayoutImagesHost from '$test/beds/hydration/LayoutImagesHost.svelte';
import { QueryClient } from '@tanstack/query-core';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { load } from './+layout.ts';
import RootLayout from './+layout.svelte';

type LoadEvent = Parameters<typeof load>[0];

const page = createRawSnippet(() => ({ render: () => '<p>Page</p>' }));

describe('load: root layout', () => {
  afterEach(() => setToken(null));

  it('should create the query client', () => {
    expect(load({ data: null } as LoadEvent)).toEqual({
      queryClient: expect.any(QueryClient),
    });
  });

  it('should leave the browser token to the app layout', () => {
    setToken({ value: 'access' });

    load({ data: null } as LoadEvent);

    expect(getToken().value).toBe('access');
  });
});

describe('component: root layout', () => {
  afterEach(() => setHydrated(false));

  it('should mark the app hydrated once its first render has mounted', async () => {
    expect(isHydrated()).toBe(false);

    render(RootLayout, {
      props: { data: { queryClient: createQueryClient() }, children: page },
    });

    expect(await screen.findByText('Page')).toBeInTheDocument();
    expect(isHydrated()).toBe(true);
  });

  it('should keep an image of its first render shown once it has mounted', async () => {
    renderLayoutImages();

    const image = await screen.findByAltText('Heretic');

    expect(isHydrated()).toBe(true);
    expect(lazyImageOf(image)).not.toHaveClass('is-pending');
  });

  it('should hide an image mounted after it has mounted', async () => {
    const { rerender } = renderLayoutImages();
    await screen.findByAltText('Heretic');

    await rerender({ late: true });

    expect(lazyImageOf(screen.getByAltText('Anticipated'))).toHaveClass(
      'is-pending',
    );
  });
});

function renderLayoutImages() {
  return render(LayoutImagesHost, {
    props: {
      layout: RootLayout,
      data: { queryClient: createQueryClient() },
      late: false,
    },
  });
}

function lazyImageOf(image: HTMLElement) {
  return image.closest('.trakt-lazy-image');
}
