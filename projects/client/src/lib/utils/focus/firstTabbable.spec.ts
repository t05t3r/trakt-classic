import { mountElement } from '$test/beds/dom/mountElement.ts';
import { describe, expect, it } from 'vitest';
import { firstTabbable } from './firstTabbable.ts';

const mountWith = (html: string) => {
  const container = mountElement('div');
  container.innerHTML = html;
  return container;
};

describe('util: firstTabbable', () => {
  it('should skip what takes no focus and return the first control', () => {
    const container = mountWith(`
      <span>Sort</span>
      <a>No link</a>
      <button disabled>Off</button>
      <div tabindex="-1">Script only</div>
      <select aria-label="Type"></select>
      <button>Rank</button>
    `);

    expect(firstTabbable(container)).toHaveAccessibleName('Type');
  });

  it.each([
    ['a link', '<a id="control" href="/watchlist">Watchlist</a>'],
    ['a button', '<button id="control">Watchlist</button>'],
    ['an input', '<input id="control" />'],
    ['a text area', '<textarea id="control"></textarea>'],
    ['an element in the tab order', '<div id="control" tabindex="0"></div>'],
  ])('should take %s as a control', (_kind, html) => {
    const container = mountWith(`<span>Sort</span>${html}`);

    expect(firstTabbable(container)).toBe(container.querySelector('#control'));
  });

  it.each([
    ['a link', '<a href="/watchlist" tabindex="-1">Watchlist</a>'],
    ['a button', '<button tabindex="-1">Watchlist</button>'],
  ])('should skip %s out of the tab order', (_kind, html) => {
    const container = mountWith(`${html}<button>Rank</button>`);

    expect(firstTabbable(container)).toHaveAccessibleName('Rank');
  });

  it.each([
    ['a control not displayed', '<button hidden>Options</button>'],
    [
      'a control inside one not displayed',
      '<div hidden><button>Options</button></div>',
    ],
  ])('should skip %s', (_kind, html) => {
    const container = mountWith(`${html}<button>Rank</button>`);

    expect(firstTabbable(container)).toHaveAccessibleName('Rank');
  });

  it('should return nothing when every control is out of the tab order', () => {
    const container = mountWith(`
      <a href="/watchlist" tabindex="-1">Watchlist</a>
      <button tabindex="-1">Rank</button>
    `);

    expect(firstTabbable(container)).toBeUndefined();
  });

  it('should return nothing when no control is inside', () => {
    const container = mountWith('<span>Sort</span>');

    expect(firstTabbable(container)).toBeUndefined();
  });
});
