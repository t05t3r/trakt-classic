import { fireEvent } from '@testing-library/svelte';

export async function markImageLoaded(image: Element | null): Promise<void> {
  if (!(image instanceof HTMLImageElement)) {
    throw new Error('markImageLoaded: no image to load');
  }

  Object.defineProperty(image, 'complete', { value: true, configurable: true });
  Object.defineProperty(image, 'naturalWidth', {
    value: 1,
    configurable: true,
  });
  await fireEvent.load(image);
}
