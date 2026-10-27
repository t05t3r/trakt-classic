import appHtml from './app.html?raw';
import { describe, expect, it } from 'vitest';

function readViewportContent(html: string) {
  return html.match(/<meta\s+name="viewport"\s+content="([^"]*)"/)?.at(1);
}

function readViewportFlags(html: string) {
  return readViewportContent(html)?.split(',').map((flag) => flag.trim()) ??
    [];
}

function readIconHref(html: string) {
  return new DOMParser()
    .parseFromString(html, 'text/html')
    .querySelector('link[rel="icon"]')
    ?.getAttribute('href');
}

describe('asset: app.html', () => {
  it('should link the favicon from the static assets', () => {
    expect(readIconHref(appHtml)).toBe('%sveltekit.assets%/favicon.svg');
  });

  it('should size the viewport to the device width', () => {
    expect(readViewportFlags(appHtml)).toContain('width=device-width');
  });

  it('should not let the browser scale the initial layout', () => {
    expect(readViewportFlags(appHtml)).toContain('initial-scale=1');
  });

  it('should extend content under the device safe area', () => {
    expect(readViewportFlags(appHtml)).toContain('viewport-fit=cover');
  });

  it('should resize the layout when a virtual keyboard opens', () => {
    expect(readViewportFlags(appHtml)).toContain(
      'interactive-widget=resizes-content',
    );
  });

  it('should not disable pinch zoom', () => {
    expect(appHtml).not.toContain('user-scalable=no');
  });
});
