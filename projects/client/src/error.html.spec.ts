import errorHtml from './error.html?raw';
import { describe, expect, it } from 'vitest';

const parse = (html: string) =>
  new DOMParser().parseFromString(html, 'text/html');

describe('asset: error.html', () => {
  it('should offer a link that reloads the failed page', () => {
    const links = [...parse(errorHtml).querySelectorAll('a')];

    expect(links.map((link) => link.getAttribute('href'))).toEqual(['']);
  });

  it('should load no image, script or stylesheet', () => {
    const external = parse(errorHtml).querySelectorAll(
      'img, script, link, iframe, object, embed',
    );

    expect(external).toHaveLength(0);
  });

  it('should render on a dark scheme', () => {
    expect(parse(errorHtml).querySelector('style')?.textContent).toContain(
      'color-scheme: dark',
    );
  });
});
