import { isHydrated } from '$lib/utils/hydration/hydration.ts';
import type { Attachment } from 'svelte/attachments';

type TrackImageLoadedProps = {
  // Read in the `{@attach}` expression, so a new src re-runs the attachment.
  src: string;
  onPending: (pending: boolean) => void;
  onFailed: (failed: boolean) => void;
};

// Pending means hidden until it loads: an image the page arrived with stays
// shown, so only one mounted or given a new src after hydration fades in.
export function trackImageLoaded(
  { onPending, onFailed }: TrackImageLoadedProps,
): Attachment<HTMLImageElement> {
  return (node) => {
    const handleLoad = () => {
      onPending(false);
      onFailed(false);
    };
    const handleError = () => {
      onPending(false);
      onFailed(true);
    };

    node.addEventListener('load', handleLoad);
    node.addEventListener('error', handleError);
    // A cached or unchanged src fires no `load`; `naturalWidth` 0 means broken.
    onPending(isHydrated() && !node.complete);
    onFailed(node.complete && node.naturalWidth === 0);

    return () => {
      node.removeEventListener('load', handleLoad);
      node.removeEventListener('error', handleError);
    };
  };
}
