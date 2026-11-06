import { fireEvent, waitFor } from '@testing-library/svelte';
import { expect } from 'vitest';

// A scroll lock turns off pointer events on the body, so the press lands on the root; at 1,1 it misses jsdom's 0,0 box.
// bits-ui re-attaches its outside-press listener just after the open and drops a press made before it.
export function closeFromOutside(
  opened: () => HTMLElement | null,
  pressed: Element = document.documentElement,
) {
  expect(opened()).toBeInTheDocument();

  return waitFor(() => {
    fireEvent.pointerDown(pressed, { clientX: 1, clientY: 1 });
    expect(opened()).not.toBeInTheDocument();
  });
}
