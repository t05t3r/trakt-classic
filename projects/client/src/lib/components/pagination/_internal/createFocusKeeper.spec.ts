import { mountElement } from '$test/beds/dom/mountElement.ts';
import { REMOVALS } from '$test/beds/focus/REMOVALS.ts';
import { describe, expect, it, onTestFinished } from 'vitest';
import { createFocusKeeper } from './createFocusKeeper.ts';

// A section whose grid holds a navigator of two controls.
function mountGrid() {
  const fallback = mountElement('section');
  const grid = mountElement('div', fallback);
  const navigator = mountElement('div', grid);
  navigator.className = 'trakt-load-more';
  const less = mountElement('button', navigator);
  const more = mountElement('button', navigator);

  return { fallback, grid, navigator, less, more };
}

describe('createFocusKeeper', () => {
  it.each(REMOVALS)(
    'should leave the focus to a navigator that stays when its control leaves, where removal $removal',
    ({ emulate }) => {
      const { fallback, grid, more } = mountGrid();
      const keeper = createFocusKeeper();
      const untrack = keeper.track(grid);
      onTestFinished(() => untrack?.());
      emulate();
      more.focus();

      more.remove();
      keeper.settle(fallback);

      expect(document.body).toHaveFocus();
      expect(fallback).not.toHaveFocus();
    },
  );

  it.each(REMOVALS)(
    'should hand the focus on when the navigator leaves, where removal $removal',
    ({ emulate }) => {
      const { fallback, grid, navigator, more } = mountGrid();
      const keeper = createFocusKeeper();
      const untrack = keeper.track(grid);
      onTestFinished(() => untrack?.());
      emulate();
      more.focus();

      navigator.remove();
      keeper.settle(fallback);

      expect(fallback).toHaveFocus();
    },
  );
});
