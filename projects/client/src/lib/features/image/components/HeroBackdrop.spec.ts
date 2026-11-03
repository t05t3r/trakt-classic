import { MovieMatrixMappedMock } from '$mocks/data/summary/movies/matrix/MovieMatrixMappedMock.ts';
import { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';
import { render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { emulateHydrated } from '$test/beds/hydration/emulateHydrated.ts';
import { markImageLoaded } from '$test/beds/image/markImageLoaded.ts';
import HeroBackdrop from './HeroBackdrop.svelte';

const BACKDROP = MovieMatrixMappedMock.cover.url.full;

describe('component: HeroBackdrop', () => {
  it('should keep the backdrop the page arrived with shown while it loads', () => {
    const { container } = render(HeroBackdrop, {
      props: { src: BACKDROP, position: 'hero' },
    });
    const backdrop = container.querySelector('img');

    expect(backdrop).toHaveAttribute('src', BACKDROP);
    expect(backdrop).not.toHaveClass('is-pending');
  });

  it('should hide a backdrop mounted after hydration until it loads', async () => {
    emulateHydrated();
    const { container } = render(HeroBackdrop, {
      props: { src: BACKDROP, position: 'hero' },
    });
    const backdrop = container.querySelector('img');
    expect(backdrop).toHaveClass('is-pending');

    await markImageLoaded(backdrop);

    expect(backdrop).not.toHaveClass('is-pending');
  });

  it('should hide a backdrop that broke before hydration', () => {
    const complete = vi
      .spyOn(HTMLImageElement.prototype, 'complete', 'get')
      .mockReturnValue(true);
    const naturalWidth = vi
      .spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get')
      .mockReturnValue(0);

    try {
      const { container } = render(HeroBackdrop, {
        props: { src: BACKDROP, position: 'hero' },
      });

      expect(container.querySelector('img')).toHaveClass('is-failed');
    } finally {
      complete.mockRestore();
      naturalWidth.mockRestore();
    }
  });

  it('should size the backdrop to a fanart', () => {
    const { container } = render(HeroBackdrop, {
      props: { src: BACKDROP, position: 'hero' },
    });
    const backdrop = container.querySelector('img');

    expect(backdrop).toHaveAttribute('width', '853');
    expect(backdrop).toHaveAttribute('height', '480');
  });

  it.each([
    ['a Placeholder', PLACEHOLDERS.fanart],
    ['no image', null],
  ])('should draw no backdrop for %s', (_case, backdrop) => {
    const { container } = render(HeroBackdrop, {
      props: { src: backdrop, position: 'hero' },
    });

    expect(container.querySelector('img')).toBeNull();
  });

  it.each(['hero', 'cover'] as const)(
    'should mark the backdrop with the %s position',
    (position) => {
      const { container } = render(HeroBackdrop, {
        props: { src: BACKDROP, position },
      });

      expect(container.querySelector('img')).toHaveAttribute(
        'data-position',
        position,
      );
    },
  );
});
