import { REMOVALS } from '$test/beds/focus/REMOVALS.ts';
import { describe, expect, it, onTestFinished } from 'vitest';
import { createFocusKeeper } from './createFocusKeeper.ts';

function append<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  parent: HTMLElement,
) {
  const element = document.createElement(tag);
  parent.append(element);
  return element;
}

// A section whose grid holds a navigator of two controls.
function mountGrid() {
  const fallback = append('section', document.body);
  onTestFinished(() => fallback.remove());
  const grid = append('div', fallback);
  const navigator = append('div', grid);
  navigator.className = 'trakt-load-more';
  const less = append('button', navigator);
  const more = append('button', navigator);

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
