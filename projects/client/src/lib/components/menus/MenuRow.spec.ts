import { glyphSnippet } from '$test/beds/buttons/glyphSnippet.ts';
import { glyphClasses } from '$test/beds/menus/glyphClasses.ts';
import { menuLabel } from '$test/beds/menus/menuLabel.ts';
import { isMenuRowChecked } from '$test/beds/subnav/isMenuRowChecked.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import MenuRow from './MenuRow.svelte';

describe('component: MenuRow', () => {
  it('should render the label', () => {
    render(MenuRow, { props: { children: menuLabel } });

    expect(screen.getByText('Watchlist')).toBeVisible();
  });

  it('should show the check when checked', () => {
    const { container } = render(MenuRow, {
      props: { checked: true, children: menuLabel },
    });

    expect(glyphClasses(container)).toEqual([
      expect.stringContaining('tabler-icon-check'),
    ]);
  });

  it.each(
    [
      { checked: true, isMarked: true },
      { checked: 'unknown', isMarked: false },
      { checked: false, isMarked: false },
      { checked: undefined, isMarked: false },
    ] as const,
  )(
    'should mark the row selected, for its accent, only when checked is true: $checked',
    ({ checked, isMarked }) => {
      const { container } = render(MenuRow, {
        props: { checked, children: menuLabel },
      });

      expect(isMenuRowChecked(container)).toBe(isMarked);
    },
  );

  it('should seat the check after the label', () => {
    const { container } = render(MenuRow, {
      props: { checked: true, children: menuLabel },
    });

    const label = screen.getByText('Watchlist');
    const check = assertDefined(container.querySelector('.menu-row-check'));
    expect(
      label.compareDocumentPosition(check) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('should show the spinner while the state is unknown', () => {
    const { container } = render(MenuRow, {
      props: { checked: 'unknown', children: menuLabel },
    });

    expect(glyphClasses(container)).toEqual([
      expect.stringContaining('tabler-icon-loader-2'),
    ]);
  });

  it('should show the pending spinner', () => {
    const { container } = render(MenuRow, {
      props: { checked: 'unknown', children: menuLabel },
    });

    expect(container.querySelector('.tabler-icon-loader-2')).toHaveClass(
      'trakt-pending-spinner',
    );
  });

  it.each([false, undefined])(
    'should leave the check slot empty when checked is %s',
    (checked) => {
      const { container } = render(MenuRow, {
        props: { checked, children: menuLabel },
      });

      expect(glyphClasses(container)).toEqual([]);
    },
  );

  it('should draw its glyph in the leading column, before the label', () => {
    const { container } = render(MenuRow, {
      props: { glyph: glyphSnippet, children: menuLabel },
    });

    const column = assertDefined(
      container.querySelector<HTMLElement>('.trakt-menu-glyph'),
    );
    expect(glyphClasses(column)).toEqual(['glyph']);
    expect(column).toHaveAttribute('aria-hidden', 'true');
    expect(
      column.compareDocumentPosition(screen.getByText('Watchlist')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(container.querySelector('.menu-row-check svg')).toBeNull();
  });

  it('should draw no leading column without a glyph', () => {
    const { container } = render(MenuRow, {
      props: { checked: true, children: menuLabel },
    });

    expect(container.querySelector('.trakt-menu-glyph')).toBeNull();
  });

  it('should hide the glyphs from assistive technology', () => {
    const { container } = render(MenuRow, {
      props: { checked: true, children: menuLabel },
    });

    const glyph = container.querySelector('svg');

    expect(glyph).not.toBeNull();
    expect(glyph?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('should mark a checked nav row for its accent, with no check', () => {
    const { container } = render(MenuRow, {
      props: { checked: true, variant: 'nav', children: menuLabel },
    });

    expect(isMenuRowChecked(container)).toBe(true);
    expect(glyphClasses(container)).toEqual([]);
  });
});
