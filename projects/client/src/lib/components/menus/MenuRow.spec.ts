import { glyphClasses } from '$test/beds/menus/glyphClasses.ts';
import { menuLabel } from '$test/beds/menus/menuLabel.ts';
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

  it('should hide the glyphs from assistive technology', () => {
    const { container } = render(MenuRow, {
      props: { checked: true, children: menuLabel },
    });

    const glyph = container.querySelector('svg');

    expect(glyph).not.toBeNull();
    expect(glyph?.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});
