import metacriticHighLogo from '$lib/assets/ratings/metacritic-high.svg?raw';
import metacriticLowLogo from '$lib/assets/ratings/metacritic-low.svg?raw';
import metacriticMediumLogo from '$lib/assets/ratings/metacritic-medium.svg?raw';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { compileAsync } from 'sass-embedded';
import { describe, expect, it } from 'vitest';

const STYLE_ROOT = join(import.meta.dirname, '..');

const compileModes = async () => {
  const { css } = await compileAsync(join(import.meta.dirname, 'modes.scss'), {
    importers: [{
      findFileUrl: (url) =>
        url.startsWith('$style/')
          ? pathToFileURL(join(STYLE_ROOT, url.slice('$style/'.length)))
          : null,
    }],
  });

  return css;
};

const METACRITIC_LOGOS = [
  ['high', metacriticHighLogo],
  ['medium', metacriticMediumLogo],
  ['low', metacriticLowLogo],
] as const;

const ringFillsOf = (svg: string) =>
  Array.from(
    new DOMParser()
      .parseFromString(svg, 'image/svg+xml')
      .querySelectorAll('path[fill]'),
    (path) => path.getAttribute('fill')?.toLowerCase(),
  ).filter((fill) => fill !== '#f2f2f2');

const mediaBlock = (css: string, query: string) =>
  css.split(`@media ${query} {`).at(1)?.split(/\n}/).at(0) ?? '';

describe('style: modes', () => {
  it('should tighten the header at widths up to and including 1200px', async () => {
    const block = mediaBlock(await compileModes(), '(max-width: 1200px)');

    expect(block).toContain('--header-gap: var(--ni-8);');
    expect(block).toContain('--header-padding-inline-start: var(--ni-16);');
    expect(block).toContain('--header-padding-inline-end: var(--ni-8);');
  });

  it('should shrink the heading icon with the h2 at widths up to and including 767px', async () => {
    const block = mediaBlock(await compileModes(), '(max-width: 767px)');

    expect(block).toContain('--font-size-h2: var(--ni-18);');
    expect(block).toContain('--icon-size-heading: var(--ni-18);');
    expect(block).toContain('--heading-icon-width: var(--ni-22);');
  });

  it('should size the hero ratings bar at its desktop values', async () => {
    const root = (await compileModes()).split('@media').at(0) ?? '';

    expect(root).toContain('--font-size-hero-rating: var(--ni-18);');
    expect(root).toContain('--icon-size-hero-rating: var(--ni-30);');
    expect(root).toContain('--ratings-bar-item-gap: var(--ni-30);');
    expect(root).toContain('--metascore-bar-height: var(--ni-8);');
    expect(root).toContain('--color-metascore-low: #ff0000;');
    expect(root).toContain('--font-size-rating-question: var(--ni-14);');
    expect(root).toContain('--color-border-ratings-bar: var(--shade-840);');
  });

  it('should close up the ratings bar items at widths from 768px to 991px', async () => {
    const block = mediaBlock(
      await compileModes(),
      '(min-width: 768px) and (max-width: 991px)',
    );

    expect(block).toContain('--ratings-bar-item-gap: var(--ni-20);');
  });

  it('should shrink the hero ratings bar at widths up to and including 767px', async () => {
    const block = mediaBlock(await compileModes(), '(max-width: 767px)');

    expect(block).toContain('--font-size-hero-rating: var(--ni-16);');
    expect(block).toContain('--icon-size-hero-rating: var(--ni-28);');
    expect(block).toContain('--ratings-bar-item-gap: var(--ni-23);');
    expect(block).toContain('--ratings-bar-height: var(--ni-100);');
  });

  it('should set the season switcher at 14px on a 50px line, and 13px on a 40px line up to 767px', async () => {
    const css = await compileModes();
    const root = css.split('@media').at(0) ?? '';
    const block = mediaBlock(css, '(max-width: 767px)');

    expect(root).toContain('--font-size-switcher: var(--ni-14);');
    expect(root).toContain('--line-height-switcher: var(--ni-50);');
    expect(block).toContain('--font-size-switcher: var(--ni-13);');
    expect(block).toContain('--line-height-switcher: var(--ni-40);');
  });

  it("should raise the sidebar poster under a switcher by Classic's season and episode overlap", async () => {
    const root = (await compileModes()).split('@media').at(0) ?? '';

    expect(root).toContain(
      '--sidebar-poster-overlap-switcher: calc(var(--ni-neg-180) - var(--header-height));',
    );
  });

  it("should size each neighbour link's box at Classic's 63 by 143", async () => {
    const root = (await compileModes()).split('@media').at(0) ?? '';

    expect(root).toContain('--neighbour-link-width: var(--ni-63);');
    expect(root).toContain('--neighbour-link-height: var(--ni-143);');
  });

  it("should hold the rating slot at Classic's popover-on width at every width", async () => {
    const [root = '', ...media] = (await compileModes()).split('@media');

    expect(root).toContain('--rating-slot-min-width: var(--ni-175);');
    expect(media.join('')).not.toContain('--rating-slot-min-width');
  });

  it("should size the cast cells at Classic's share of the row per breakpoint", async () => {
    const [root = '', ...media] = (await compileModes()).split('@media');

    expect(root).toContain('--cast-cell-width-desktop-lg: 10.15%;');
    expect(root).toContain('--cast-cell-width-tablet-lg: 12.73%;');
    expect(root).toContain('--cast-cell-width-tablet-sm: 17%;');
    expect(root).toContain('--cast-cell-width-mobile: 25%;');
    expect(media.join('')).not.toContain('--cast-cell-width');
  });

  it("should split the episode row at Classic's column spans per breakpoint", async () => {
    const [root = '', ...media] = (await compileModes()).split('@media');

    expect(root).toContain('--episode-card-column-span-tablet: 5;');
    expect(root).toContain('--episode-card-column-span-desktop: 4;');
    expect(root).toContain('--episode-info-column-span-tablet: 7;');
    expect(root).toContain('--episode-info-column-span-desktop: 8;');
    expect(media.join('')).not.toContain('--episode-card-column-span');
    expect(media.join('')).not.toContain('--episode-info-column-span');
  });

  it.each(METACRITIC_LOGOS)(
    'should fill the %s metacritic logo ring with its metascore band colour',
    async (band, svg) => {
      const root = (await compileModes()).split('@media').at(0) ?? '';
      const token = root
        .match(new RegExp(`--color-metascore-${band}:\\s*([^;]+);`))
        ?.at(1);

      expect(token).toMatch(/^#[0-9a-f]{6}$/i);
      expect(ringFillsOf(svg)).toEqual([token?.toLowerCase()]);
    },
  );
});
