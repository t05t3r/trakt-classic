import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { compileStringAsync } from 'sass-embedded';
import { describe, expect, it } from 'vitest';

const compileRule = async (body: string) => {
  const { css } = await compileStringAsync(
    `@use 'index' as *; a { ${body} }`,
    {
      url: pathToFileURL(join(import.meta.dirname, 'spec.scss')),
      style: 'compressed',
    },
  );

  return css;
};

const includeMixin = (mixin: string) =>
  compileRule(`@include ${mixin} { color: red; }`);

describe('style: mixins', () => {
  it('should apply for-desktop-lg-and-below at widths up to and including 1200px', async () => {
    expect(await includeMixin('for-desktop-lg-and-below')).toBe(
      '@media(max-width: 1200px){a{color:red}}',
    );
  });

  it('should set the property to the colour of each episode type', async () => {
    expect(
      await compileRule('@include episode-type-color(background-color);'),
    ).toBe(
      [
        'a[data-type=series_premiere]{background-color:var(--color-episode-series-premiere)}',
        'a[data-type=season_premiere]{background-color:var(--color-episode-season-premiere)}',
        'a[data-type=mid_season_premiere]{background-color:var(--color-episode-midseason-premiere)}',
        'a[data-type=mid_season_finale]{background-color:var(--color-episode-midseason-finale)}',
        'a[data-type=season_finale]{background-color:var(--color-episode-season-finale)}',
        'a[data-type=series_finale]{background-color:var(--color-episode-series-finale)}',
      ].join(''),
    );
  });

  it('should set a custom property to the colour of the episode type', async () => {
    expect(
      await compileRule('@include episode-type-color(--ribbon-color);'),
    ).toContain(
      'a[data-type=season_finale]{--ribbon-color:var(--color-episode-season-finale)}',
    );
  });

  it("should draw a caption tag's box, its colour left to the caller", async () => {
    expect(await compileRule('@include caption-tag-box;')).toBe(
      [
        'a{display:inline-block;',
        'margin-block:var(--ni-0) var(--ni-5);',
        'margin-inline:var(--ni-0) var(--ni-5);',
        'padding-block:var(--ni-3);',
        'padding-inline:var(--ni-5);',
        'color:var(--color-text-primary);',
        'font-family:var(--font-family-heading);',
        'font-size:var(--font-size-label);',
        'font-weight:var(--font-weight-heading)}',
      ].join(''),
    );
  });

  it('should set an inline box no wider than its container, top-aligned on the line', async () => {
    expect(await compileRule('@include clipped-inline-box;')).toBe(
      'a{display:inline-block;max-width:100%;vertical-align:top}',
    );
  });

  it('should draw the focus ring inside the box, with a copy above the content', async () => {
    expect(await compileRule('@include inset-focus-ring;')).toBe(
      [
        'a:focus-visible{outline-offset:var(--ni-neg-1)}',
        'a:focus-visible::after{content:"";',
        'position:absolute;',
        'inset:var(--ni-0);',
        'z-index:var(--layer-raised);',
        'outline:inherit;',
        'outline-offset:inherit;',
        'pointer-events:none}',
      ].join(''),
    );
  });
  it('should set phone poster cells gutterless, with a divider before each even cell', async () => {
    expect(await compileRule("@include phone-poster-cells('.cell');")).toBe(
      [
        '@media(max-width: 767px){',
        'a .cell{padding-inline:var(--ni-0)}',
        'a .cell:nth-child(even){',
        '--poster-card-divider: var(--border-thickness-xxs) solid var(--color-border-subtle);',
        '--poster-card-divider-offset: var(--ni-neg-1)}}',
      ].join(''),
    );
  });

  it('should set phone poster cells gutterless with no divider', async () => {
    expect(
      await compileRule(
        "@include phone-poster-cells('.cell', $divider: false);",
      ),
    ).toBe('@media(max-width: 767px){a .cell{padding-inline:var(--ni-0)}}');
  });

  it("should set a heading's lead glyph at the width it is given, on the heading's line", async () => {
    expect(await compileRule('@include heading-glyph(var(--width));')).toBe(
      [
        'a{width:var(--width);',
        'height:var(--icon-size-heading);',
        'margin-inline-end:var(--ni-10);',
        'stroke-width:var(--icon-stroke-chrome);',
        'vertical-align:top}',
      ].join(''),
    );
  });

  it("should span the summary info column's columns, ending at the grid's end, from the small tablet up", async () => {
    expect(await compileRule('@include summary-info-column;')).toBe(
      [
        '@media(min-width: 768px)and (max-width: 991px){',
        'a{grid-column:span var(--summary-info-column-span-tablet)/-1}}',
        '@media(min-width: 992px){',
        'a{grid-column:span var(--summary-info-column-span-desktop)/-1}}',
      ].join(''),
    );
  });

  it("should ring an avatar round, in the avatar ring's colour by default", async () => {
    expect(await compileRule('@include ringed-avatar;')).toBe(
      [
        'a{box-sizing:border-box;',
        'overflow:hidden;',
        'border:var(--avatar-ring) solid var(--color-avatar-ring);',
        'border-radius:var(--border-radius-round);',
        'background:var(--color-avatar-ring)}',
      ].join(''),
    );
  });

  it('should ring an avatar in the colour it is given', async () => {
    expect(await compileRule('@include ringed-avatar(var(--ring));')).toContain(
      'border:var(--avatar-ring) solid var(--ring);',
    );
  });

  it('should ring an avatar at the width it is given', async () => {
    expect(
      await compileRule(
        '@include ringed-avatar(var(--ring), var(--avatar-ring-l));',
      ),
    ).toContain('border:var(--avatar-ring-l) solid var(--ring);');
  });

  it('should fill an avatar in the colour it is given', async () => {
    expect(
      await compileRule(
        '@include ringed-avatar(var(--ring), var(--avatar-ring-l), var(--fill));',
      ),
    ).toContain('background:var(--fill)}');
  });

  it('should fade a watched item, in full under the focus or a mouse hover', async () => {
    expect(await compileRule('@include watched-fade;')).toBe(
      [
        'a{opacity:var(--watched-fade-opacity)}',
        'a:focus-within{opacity:1}',
        '@media(hover: hover)and (pointer: fine){a:hover{opacity:1}}',
      ].join(''),
    );
  });

  it('should dim a blocked control under a not-allowed cursor, in full while it has keyboard focus', async () => {
    expect(await compileRule('@include blocked-control;')).toBe(
      [
        'a{opacity:var(--action-blocked-opacity);cursor:not-allowed}',
        'a:focus-visible{opacity:1}',
      ].join(''),
    );
  });

  it('should draw a thin scrollbar, with the standard properties where the WebKit ones are missing', async () => {
    expect(await compileRule('@include thin-scrollbar;')).toBe(
      [
        'a::-webkit-scrollbar{height:var(--ni-6)}',
        'a::-webkit-scrollbar-track{border-radius:var(--border-radius-xs);',
        'background:var(--color-scrollbar-track)}',
        'a::-webkit-scrollbar-thumb{border-radius:var(--border-radius-xs);',
        'background:var(--color-scrollbar-thumb)}',
        'a::-webkit-scrollbar-thumb:hover{background:var(--color-scrollbar-thumb-hover)}',
        '@supports not selector(::-webkit-scrollbar){a{scrollbar-width:thin;',
        'scrollbar-color:var(--color-scrollbar-thumb-standard) var(--color-scrollbar-track)}}',
      ].join(''),
    );
  });
});
