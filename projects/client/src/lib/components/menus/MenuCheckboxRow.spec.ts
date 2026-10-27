import { glyphClasses } from '$test/beds/menus/glyphClasses.ts';
import { menuLabel } from '$test/beds/menus/menuLabel.ts';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MenuCheckboxRow from './MenuCheckboxRow.svelte';

const row = () => screen.getByRole('checkbox', { name: 'Watchlist' });

describe('component: MenuCheckboxRow', () => {
  it('should render a button checkbox named by its label', () => {
    render(MenuCheckboxRow, {
      props: { checked: false, onToggle: vi.fn(), children: menuLabel },
    });

    expect(row()).toBeVisible();
    expect(row().tagName).toBe('BUTTON');
    expect(row()).toHaveAttribute('type', 'button');
  });

  it.each(
    [
      { checked: true, ariaChecked: 'true' },
      { checked: false, ariaChecked: 'false' },
      { checked: 'unknown', ariaChecked: 'false' },
    ] as const,
  )(
    'should read aria-checked $ariaChecked when checked is $checked',
    ({ checked, ariaChecked }) => {
      render(MenuCheckboxRow, {
        props: { checked, onToggle: vi.fn(), children: menuLabel },
      });

      expect(row()).toHaveAttribute('aria-checked', ariaChecked);
    },
  );

  it('should read as disabled while the state is unknown', () => {
    render(MenuCheckboxRow, {
      props: { checked: 'unknown', onToggle: vi.fn(), children: menuLabel },
    });

    expect(row()).toHaveAttribute('aria-disabled', 'true');
  });

  it.each([true, false])(
    'should not read as disabled when checked is %s',
    (checked) => {
      render(MenuCheckboxRow, {
        props: { checked, onToggle: vi.fn(), children: menuLabel },
      });

      expect(row()).not.toHaveAttribute('aria-disabled');
    },
  );

  it.each(
    [
      { checked: true, shown: 'the check', glyph: ['tabler-icon-check'] },
      {
        checked: 'unknown',
        shown: 'the spinner',
        glyph: ['tabler-icon-loader-2'],
      },
      { checked: false, shown: 'no glyph', glyph: [] },
    ] as const,
  )(
    'should show $shown in the check slot when checked is $checked',
    ({ checked, glyph }) => {
      const { container } = render(MenuCheckboxRow, {
        props: { checked, onToggle: vi.fn(), children: menuLabel },
      });

      expect(glyphClasses(container)).toEqual(
        glyph.map((name) => expect.stringContaining(name)),
      );
    },
  );

  it('should toggle on click', async () => {
    const onToggle = vi.fn();
    render(MenuCheckboxRow, {
      props: { checked: false, onToggle, children: menuLabel },
    });

    await userEvent.click(row());

    expect(onToggle).toHaveBeenCalledOnce();
  });

  it.each([
    { name: 'Enter', key: '{Enter}' },
    { name: 'Space', key: ' ' },
  ])('should toggle on $name', async ({ key }) => {
    const onToggle = vi.fn();
    render(MenuCheckboxRow, {
      props: { checked: true, onToggle, children: menuLabel },
    });

    row().focus();
    await userEvent.keyboard(key);

    expect(onToggle).toHaveBeenCalledOnce();
  });
});
