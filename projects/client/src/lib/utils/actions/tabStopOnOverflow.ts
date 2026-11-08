import { observeResize } from './observeResize.ts';

// The keyboard scrolls what holds the focus, and not every browser lets Tab reach a scroller by itself.
export function tabStopOnOverflow(node: HTMLElement) {
  const { destroy } = observeResize(node, () => {
    if (node.scrollHeight > node.clientHeight) {
      node.setAttribute('tabindex', '0');
      return;
    }
    node.removeAttribute('tabindex');
  });

  return { destroy };
}
