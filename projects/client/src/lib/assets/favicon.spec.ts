import IconPlayerPlay from '@tabler/icons-svelte/icons/player-play';
import favicon from '$static/favicon.svg?raw';
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

const OUTLINE_ATTRIBUTES = [
  'fill',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
];

function parseFavicon() {
  return new DOMParser()
    .parseFromString(favicon, 'image/svg+xml')
    .documentElement;
}

function renderTablerIcon() {
  return render(IconPlayerPlay).container;
}

function readPathData(root: ParentNode) {
  return Array.from(root.querySelectorAll('path'))
    .map((path) => path.getAttribute('d'));
}

function readOutlineAttributes(svg: Element | null) {
  return OUTLINE_ATTRIBUTES.map((name) => svg?.getAttribute(name));
}

describe('asset: favicon.svg', () => {
  it('should be an SVG document', () => {
    const svg = parseFavicon();

    expect(svg.tagName).toBe('svg');
    expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
  });

  it('should draw the Tabler Icons player-play outline paths', () => {
    expect(readPathData(parseFavicon())).toEqual(
      readPathData(renderTablerIcon()),
    );
  });

  it('should keep the Tabler Icons outline fill and stroke shape', () => {
    expect(readOutlineAttributes(parseFavicon())).toEqual(
      readOutlineAttributes(renderTablerIcon().querySelector('svg')),
    );
  });

  it('should stroke in a fixed hex colour', () => {
    expect(parseFavicon().getAttribute('stroke')).toMatch(/^#[\da-f]{6}$/i);
  });
});
