import { useMedia } from '$lib/stores/css/useMedia.ts';
import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';

const scrollOffset = 8;
export function scrollActiveItemIntoView(
  element: HTMLElement,
  active: boolean,
) {
  let rafId: number | null = null;
  let isReducedMotion = false;
  const reducedMotion = useMedia(WELL_KNOWN_MEDIA_QUERY.reducedMotion)
    .subscribe((matches) => {
      isReducedMotion = matches;
    });

  const cancelScroll = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  };

  const doScroll = (active: boolean, behavior: 'smooth' | 'instant') => {
    // Before the check, so an item that stops being current drops the scroll it still had pending.
    cancelScroll();
    if (!active) return;

    const parent = element.parentElement;
    if (!parent) return;

    const parentRight = parent.scrollLeft + parent.clientWidth;
    const elementLeft = element.offsetLeft;
    const elementRight = elementLeft + element.offsetWidth;
    const isOutOfView = elementRight > parentRight ||
      elementLeft < parent.scrollLeft;

    if (!isOutOfView) return;

    rafId = requestAnimationFrame(() => {
      parent.scrollTo({
        left: elementLeft - scrollOffset,
        behavior,
      });
    });
  };

  doScroll(active, 'instant');

  return {
    update: (active: boolean) => {
      doScroll(active, isReducedMotion ? 'instant' : 'smooth');
    },
    destroy: () => {
      cancelScroll();
      reducedMotion.unsubscribe();
    },
  };
}
