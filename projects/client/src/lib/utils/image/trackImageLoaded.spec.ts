import { fireEvent } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { emulateHydrated } from '$test/beds/hydration/emulateHydrated.ts';
import { markImageLoaded } from '$test/beds/image/markImageLoaded.ts';
import { trackImageLoaded } from './trackImageLoaded.ts';

const SRC = '/img/movies/000/012/601/posters/thumb/e0d9dd35c5.jpg.webp';

function attachTo(image: HTMLImageElement) {
  const onPending = vi.fn();
  const onFailed = vi.fn();
  const detach = trackImageLoaded({ src: SRC, onPending, onFailed })(image);

  return { onPending, onFailed, detach };
}

function imageAt(src: string): HTMLImageElement {
  const image = document.createElement('img');
  image.src = src;
  return image;
}

describe('util: trackImageLoaded', () => {
  it('should report the image failed once it fires error', async () => {
    const image = imageAt(SRC);
    const { onFailed } = attachTo(image);

    await fireEvent.error(image);

    expect(onFailed).toHaveBeenLastCalledWith(true);
  });

  it('should report an image already broken at attach as failed', () => {
    const image = imageAt(SRC);
    Object.defineProperty(image, 'complete', { value: true });
    Object.defineProperty(image, 'naturalWidth', { value: 0 });

    const { onFailed } = attachTo(image);

    expect(onFailed).toHaveBeenLastCalledWith(true);
  });

  it('should not report an image still loading at attach as failed', () => {
    const { onFailed } = attachTo(imageAt(SRC));

    expect(onFailed).toHaveBeenLastCalledWith(false);
  });

  it('should clear the failed state once the image loads', async () => {
    const image = imageAt(SRC);
    const { onFailed } = attachTo(image);
    await fireEvent.error(image);

    await markImageLoaded(image);

    expect(onFailed).toHaveBeenLastCalledWith(false);
  });

  it('should stop reporting once detached', async () => {
    const image = imageAt(SRC);
    const { onFailed, detach } = attachTo(image);
    onFailed.mockClear();

    detach?.();
    await fireEvent.error(image);

    expect(onFailed).not.toHaveBeenCalled();
  });

  describe('after hydration', () => {
    it('should stop reporting the image pending once it fires error', async () => {
      emulateHydrated();
      const image = imageAt(SRC);
      const { onPending } = attachTo(image);

      await fireEvent.error(image);

      expect(onPending).toHaveBeenLastCalledWith(false);
    });

    it('should not report an image already broken at attach as pending', () => {
      emulateHydrated();
      const image = imageAt(SRC);
      Object.defineProperty(image, 'complete', { value: true });
      Object.defineProperty(image, 'naturalWidth', { value: 0 });

      const { onPending } = attachTo(image);

      expect(onPending).toHaveBeenLastCalledWith(false);
    });
  });
});
