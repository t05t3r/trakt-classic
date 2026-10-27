import { fireEvent, render } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';
import { emulateHydrated } from '$test/beds/hydration/emulateHydrated.ts';
import { markImageLoaded } from '$test/beds/image/markImageLoaded.ts';
import LazyImage from './LazyImage.svelte';

describe('component: LazyImage', () => {
  it('should keep an image the page arrived with shown while it loads', () => {
    const { container } = render(LazyImage, {
      props: {
        src: '/img/movies/000/012/601/posters/thumb/e0d9dd35c5.jpg.webp',
        alt: 'Heretic',
        kind: 'poster',
      },
    });

    expect(container.querySelector('.trakt-lazy-image')).not.toHaveClass(
      'is-pending',
    );
    expect(container.querySelector('.loading-indicator')).toBeNull();
  });

  it('should hide an image whose src arrives after hydration until it loads', async () => {
    const { container, rerender } = render(LazyImage, {
      props: { src: null, alt: 'Heretic', kind: 'poster' },
    });
    emulateHydrated();

    await rerender({
      src: '/img/movies/000/012/601/posters/thumb/e0d9dd35c5.jpg.webp',
      alt: 'Heretic',
      kind: 'poster',
    });

    expect(container.querySelector('.trakt-lazy-image')).toHaveClass(
      'is-pending',
    );
  });

  it('should mark the root as failed and keep the placeholder visible on error', async () => {
    const { container } = render(LazyImage, {
      props: {
        src: '/img/movies/000/012/601/posters/thumb/e0d9dd35c5.jpg.webp',
        alt: 'Heretic',
        kind: 'poster',
      },
    });

    const image = container.querySelector('img.image');
    expect(image).not.toBeNull();

    await fireEvent.error(image as HTMLImageElement);

    const root = container.querySelector('.trakt-lazy-image');
    expect(root).toHaveClass('is-failed');
    expect(container.querySelector('img.placeholder')).toBeVisible();
  });

  it('should mark the root as failed when the image broke before hydration', () => {
    const complete = vi
      .spyOn(HTMLImageElement.prototype, 'complete', 'get')
      .mockReturnValue(true);
    const naturalWidth = vi
      .spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get')
      .mockReturnValue(0);

    try {
      const { container } = render(LazyImage, {
        props: {
          src: '/img/movies/000/012/601/posters/thumb/e0d9dd35c5.jpg.webp',
          alt: 'Heretic',
          kind: 'poster',
        },
      });

      expect(container.querySelector('.trakt-lazy-image')).toHaveClass(
        'is-failed',
      );
    } finally {
      complete.mockRestore();
      naturalWidth.mockRestore();
    }
  });

  it('should render only the placeholder when src is Nil', () => {
    const { container } = render(LazyImage, {
      props: { src: null, alt: 'Heretic', kind: 'poster' },
    });

    expect(container.querySelector('img.placeholder')).not.toBeNull();
    expect(container.querySelector('img.image')).toBeNull();
  });

  it('should render only the placeholder when src is the Placeholder itself', () => {
    const { container } = render(LazyImage, {
      props: { src: PLACEHOLDERS.poster, alt: 'Heretic', kind: 'poster' },
    });

    expect(container.querySelector('img.placeholder')).not.toBeNull();
    expect(container.querySelector('img.image')).toBeNull();
    expect(container.querySelector('.loading-indicator')).toBeNull();
  });

  it('should not show the loading indicator when src is Nil', () => {
    const { container } = render(LazyImage, {
      props: { src: null, alt: 'Heretic', kind: 'poster' },
    });

    expect(container.querySelector('.loading-indicator')).toBeNull();
  });

  it('should default the image to lazy loading', () => {
    const { container } = render(LazyImage, {
      props: {
        src: '/img/movies/000/012/601/posters/thumb/e0d9dd35c5.jpg.webp',
        alt: 'Heretic',
        kind: 'poster',
      },
    });

    expect(container.querySelector('img.image')).toHaveAttribute(
      'loading',
      'lazy',
    );
  });

  it('should pass an eager loading prop through to the image', () => {
    const { container } = render(LazyImage, {
      props: {
        src: '/img/movies/000/012/601/posters/thumb/e0d9dd35c5.jpg.webp',
        alt: 'Heretic',
        kind: 'poster',
        loading: 'eager',
      },
    });

    expect(container.querySelector('img.image')).toHaveAttribute(
      'loading',
      'eager',
    );
  });

  it('should set alt on the image and hide the placeholder from assistive tech', () => {
    const { container } = render(LazyImage, {
      props: {
        src: '/img/movies/000/012/601/posters/thumb/e0d9dd35c5.jpg.webp',
        alt: 'Heretic',
        kind: 'poster',
      },
    });

    expect(container.querySelector('img.image')).toHaveAttribute(
      'alt',
      'Heretic',
    );

    const placeholder = container.querySelector('img.placeholder');
    expect(placeholder).toHaveAttribute('alt', '');
    expect(placeholder).toHaveAttribute('aria-hidden', 'true');
  });

  it.each(
    [
      { kind: 'poster', width: '300', height: '450' },
      { kind: 'fanart', width: '853', height: '480' },
      { kind: 'avatar', width: '256', height: '256' },
    ] as const,
  )(
    'should size both images of the $kind kind to its intrinsic size',
    ({ kind, width, height }) => {
      const { container } = render(LazyImage, {
        props: {
          src: '/img/movies/000/012/601/posters/thumb/e0d9dd35c5.jpg.webp',
          alt: 'Heretic',
          kind,
        },
      });

      const sizes = [...container.querySelectorAll('img')].map((image) => [
        image.getAttribute('width'),
        image.getAttribute('height'),
      ]);

      expect(sizes).toEqual([[width, height], [width, height]]);
    },
  );

  describe('mounted after hydration', () => {
    beforeEach(() => {
      emulateHydrated();
    });

    it('should hide the image until it loads', async () => {
      const { container } = render(LazyImage, {
        props: {
          src: '/img/movies/000/012/601/posters/thumb/e0d9dd35c5.jpg.webp',
          alt: 'Heretic',
          kind: 'poster',
        },
      });
      const root = container.querySelector('.trakt-lazy-image');
      expect(root).toHaveClass('is-pending');

      await markImageLoaded(container.querySelector('img.image'));

      expect(root).not.toHaveClass('is-pending');
    });

    it('should show the loading indicator until the image loads', async () => {
      const { container } = render(LazyImage, {
        props: {
          src: '/img/movies/000/012/601/posters/thumb/e0d9dd35c5.jpg.webp',
          alt: 'Heretic',
          kind: 'poster',
        },
      });

      expect(container.querySelector('.loading-indicator')).not.toBeNull();

      const image = container.querySelector('img.image');
      await markImageLoaded(image);

      expect(container.querySelector('.loading-indicator')).toBeNull();
    });

    it('should hide the loading indicator once the image fails', async () => {
      const { container } = render(LazyImage, {
        props: {
          src: '/img/movies/000/012/601/posters/thumb/e0d9dd35c5.jpg.webp',
          alt: 'Heretic',
          kind: 'poster',
        },
      });

      expect(container.querySelector('.loading-indicator')).not.toBeNull();

      const image = container.querySelector('img.image');
      expect(image).not.toBeNull();
      await fireEvent.error(image as HTMLImageElement);

      expect(container.querySelector('.loading-indicator')).toBeNull();
    });

    it('should reset the failed state and hide the new src until it loads when a reused instance gets one', async () => {
      const firstSrc =
        '/img/movies/000/012/601/posters/thumb/e0d9dd35c5.jpg.webp';
      const secondSrc =
        '/img/movies/000/075/994/posters/thumb/a12a59d031.jpg.webp';

      // The first src is broken and stays complete; the second is still loading.
      const complete = vi
        .spyOn(HTMLImageElement.prototype, 'complete', 'get')
        .mockImplementation(function (this: HTMLImageElement) {
          return this.getAttribute('src') === firstSrc;
        });

      try {
        const { container, rerender } = render(LazyImage, {
          props: { src: firstSrc, alt: 'Heretic', kind: 'poster' },
        });
        const root = container.querySelector('.trakt-lazy-image');
        expect(root).toHaveClass('is-failed');

        await rerender({ src: secondSrc, alt: 'Anticipated', kind: 'poster' });

        expect(root).not.toHaveClass('is-failed');
        expect(root).toHaveClass('is-pending');

        await markImageLoaded(container.querySelector('img.image'));

        expect(root).not.toHaveClass('is-pending');
        expect(root).not.toHaveClass('is-failed');
      } finally {
        complete.mockRestore();
      }
    });

    it('should mark a reused instance loaded when a new src is already cached, without a load event', async () => {
      const firstSrc =
        '/img/movies/000/012/601/posters/thumb/e0d9dd35c5.jpg.webp';
      const secondSrc =
        '/img/movies/000/075/994/posters/thumb/a12a59d031.jpg.webp';

      const { container, rerender } = render(LazyImage, {
        props: { src: firstSrc, alt: 'Heretic', kind: 'poster' },
      });

      const firstImage = container.querySelector('img.image');
      expect(firstImage).not.toBeNull();
      await fireEvent.error(firstImage as HTMLImageElement);
      expect(container.querySelector('.trakt-lazy-image')).toHaveClass(
        'is-failed',
      );

      const complete = vi
        .spyOn(HTMLImageElement.prototype, 'complete', 'get')
        .mockReturnValue(true);
      const naturalWidth = vi
        .spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get')
        .mockReturnValue(1);

      try {
        await rerender({ src: secondSrc, alt: 'Anticipated', kind: 'poster' });

        const root = container.querySelector('.trakt-lazy-image');
        expect(root).not.toHaveClass('is-pending');
        expect(root).not.toHaveClass('is-failed');
      } finally {
        complete.mockRestore();
        naturalWidth.mockRestore();
      }
    });
  });
});
