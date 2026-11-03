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

const rootBlock = (css: string) => css.split('@media').at(0) ?? '';

const rootAndMedia = (css: string) => {
  const [root = '', ...media] = css.split('@media');
  return { root, media: media.join('') };
};

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
    const root = rootBlock(await compileModes());

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
    const root = rootBlock(css);
    const block = mediaBlock(css, '(max-width: 767px)');

    expect(root).toContain('--font-size-switcher: var(--ni-14);');
    expect(root).toContain('--line-height-switcher: var(--ni-50);');
    expect(block).toContain('--font-size-switcher: var(--ni-13);');
    expect(block).toContain('--line-height-switcher: var(--ni-40);');
  });

  it("should raise the sidebar poster under a switcher by Classic's season and episode overlap", async () => {
    const root = rootBlock(await compileModes());

    expect(root).toContain(
      '--sidebar-poster-overlap-switcher: calc(var(--ni-neg-180) - var(--header-height));',
    );
  });

  it("should size each neighbour link's box at Classic's 63 by 143", async () => {
    const root = rootBlock(await compileModes());

    expect(root).toContain('--neighbour-link-width: var(--ni-63);');
    expect(root).toContain('--neighbour-link-height: var(--ni-143);');
  });

  it("should hold the rating slot at Classic's popover-on width at every width", async () => {
    const { root, media } = rootAndMedia(await compileModes());

    expect(root).toContain('--rating-slot-min-width: var(--ni-175);');
    expect(media).not.toContain('--rating-slot-min-width');
  });

  it("should size the cast cells at Classic's share of the row per breakpoint", async () => {
    const { root, media } = rootAndMedia(await compileModes());

    expect(root).toContain('--cast-cell-width-desktop-lg: 10.15%;');
    expect(root).toContain('--cast-cell-width-tablet-lg: 12.73%;');
    expect(root).toContain('--cast-cell-width-tablet-sm: 17%;');
    expect(root).toContain('--cast-cell-width-mobile: 25%;');
    expect(media).not.toContain('--cast-cell-width');
  });

  it("should split the episode row at Classic's column spans per breakpoint", async () => {
    const { root, media } = rootAndMedia(await compileModes());

    expect(root).toContain('--episode-card-column-span-tablet: 5;');
    expect(root).toContain('--episode-card-column-span-desktop: 4;');
    expect(root).toContain('--episode-info-column-span-tablet: 7;');
    expect(root).toContain('--episode-info-column-span-desktop: 8;');
    expect(media).not.toContain('--episode-card-column-span');
    expect(media).not.toContain('--episode-info-column-span');
  });

  it('should pad the profile tab links 17px, 12px up to 1200px and 8px up to 991px', async () => {
    const css = await compileModes();
    const root = rootBlock(css);
    const desktopLg = mediaBlock(css, '(max-width: 1200px)');
    const tabletSm = mediaBlock(css, '(max-width: 991px)');
    const declarations = css.match(/--profile-tab-padding-inline: [^;]+;/g);

    expect(root).toContain('--profile-tab-padding-inline: var(--ni-17);');
    expect(desktopLg).toContain('--profile-tab-padding-inline: var(--ni-12);');
    expect(tabletSm).toContain('--profile-tab-padding-inline: var(--ni-8);');
    expect(declarations).toEqual([
      '--profile-tab-padding-inline: var(--ni-17);',
      '--profile-tab-padding-inline: var(--ni-12);',
      '--profile-tab-padding-inline: var(--ni-8);',
    ]);
  });

  it('should shrink the private label on portrait phones', async () => {
    const css = await compileModes();
    const root = rootBlock(css);
    const block = mediaBlock(
      css,
      '(max-width: 767px) and (orientation: portrait)',
    );

    expect(root).toContain(
      '--font-size-private-label: var(--font-size-label-lg);',
    );
    expect(root).toContain('--private-label-padding-block: var(--ni-5);');
    expect(root).toContain('--private-label-padding-inline: var(--ni-7);');
    expect(root).toContain('--private-label-margin-block-end: var(--ni-5);');
    expect(root).toContain(
      '--private-label-margin-inline-start: var(--ni-10);',
    );
    expect(block).toContain('--font-size-private-label: var(--ni-14);');
    expect(block).toContain('--private-label-padding-block: var(--ni-3);');
    expect(block).toContain('--private-label-padding-inline: var(--ni-5);');
    expect(block).toContain('--private-label-margin-block-end: var(--ni-3);');
    expect(block).toContain(
      '--private-label-margin-inline-start: var(--ni-7);',
    );
  });

  it("should set the user cover at Classic's desktop values", async () => {
    const root = rootBlock(await compileModes());

    expect(root).toContain(
      '--cover-content-offset: calc(var(--ni-30) + var(--header-height));',
    );
    expect(root).toContain('--cover-avatar-inset: var(--ni-0);');
    expect(root).toContain('--color-cover-tint: transparent;');
    expect(root).toContain('--avatar-size-cover: var(--avatar-size-l);');
    expect(root).toContain('--cover-avatar-gap: var(--ni-15);');
    expect(root).toContain('--font-size-cover-title: var(--ni-34);');
    expect(root).toContain('--cover-title-padding-block-start: var(--ni-6);');
  });

  it('should shorten and tint the user cover on portrait phones', async () => {
    const block = mediaBlock(
      await compileModes(),
      '(max-width: 767px) and (orientation: portrait)',
    );

    expect(block).toContain(
      '--cover-height-slim: calc(var(--ni-120) + var(--header-height));',
    );
    expect(block).toContain('--cover-content-offset: var(--ni-60);');
    expect(block).toContain(
      '--cover-avatar-inset: calc(var(--ni-20) - var(--gutter-half));',
    );
    expect(block).toContain(
      '--color-cover-tint: var(--color-overlay-dark-40);',
    );
    expect(block).toContain('--avatar-size-cover: var(--ni-50);');
    expect(block).toContain('--cover-avatar-gap: var(--ni-10);');
    expect(block).toContain('--font-size-cover-title: var(--ni-24);');
    expect(block).toContain('--cover-title-padding-block-start: var(--ni-4);');
  });

  it('should set the list title bar at 18px, and 16px up to 767px', async () => {
    const css = await compileModes();
    const root = rootBlock(css);
    const block = mediaBlock(css, '(max-width: 767px)');

    expect(root).toContain(
      '--font-size-title-bar: var(--font-size-h2-compact);',
    );
    expect(block).toContain('--font-size-title-bar: var(--ni-16);');
  });

  it("should set the list subnav at Classic's description surface and 20px gear", async () => {
    const { root, media } = rootAndMedia(await compileModes());

    expect(root).toContain(
      '--color-surface-list-description: var(--shade-870);',
    );
    expect(root).toContain('--icon-size-subnav: var(--ni-20);');
    expect(media).not.toContain('--icon-size-subnav');
  });

  it.each(METACRITIC_LOGOS)(
    'should fill the %s metacritic logo ring with its metascore band colour',
    async (band, svg) => {
      const root = rootBlock(await compileModes());
      const token = root
        .match(new RegExp(`--color-metascore-${band}:\\s*([^;]+);`))
        ?.at(1);

      expect(token).toMatch(/^#[0-9a-f]{6}$/i);
      expect(ringFillsOf(svg)).toEqual([token?.toLowerCase()]);
    },
  );
});
