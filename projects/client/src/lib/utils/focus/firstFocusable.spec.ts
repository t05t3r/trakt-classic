import { mountElement } from '$test/beds/dom/mountElement.ts';
import { describe, expect, it } from 'vitest';
import { firstFocusable } from './firstFocusable.ts';

const mountWith = (html: string) => {
  const container = mountElement('div');
  container.innerHTML = html;
  return container;
};

describe('util: firstFocusable', () => {
  it('should skip what takes no focus and return the first control', () => {
    const container = mountWith(`
      <span>Sort</span>
      <a>No link</a>
      <button disabled>Off</button>
      <div tabindex="-1">Script only</div>
      <select aria-label="Type"></select>
      <button>Rank</button>
    `);

    expect(firstFocusable(container)).toHaveAccessibleName('Type');
  });

  it.each([
    ['a link', '<a id="control" href="/watchlist">Watchlist</a>'],
    ['a button', '<button id="control">Watchlist</button>'],
    ['an input', '<input id="control" />'],
    ['a text area', '<textarea id="control"></textarea>'],
    ['an element in the tab order', '<div id="control" tabindex="0"></div>'],
  ])('should take %s as a control', (_kind, html) => {
    const container = mountWith(`<span>Sort</span>${html}`);

    expect(firstFocusable(container)).toBe(container.querySelector('#control'));
  });

  it('should return nothing when no control is inside', () => {
    const container = mountWith('<span>Sort</span>');

    expect(firstFocusable(container)).toBeUndefined();
  });
});
