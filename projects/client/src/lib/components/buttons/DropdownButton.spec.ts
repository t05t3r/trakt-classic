import { glyphSnippet } from '$test/beds/buttons/glyphSnippet.ts';
import { menuLabel } from '$test/beds/menus/menuLabel.ts';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DropdownButton from './DropdownButton.svelte';

const button = (name: string) => screen.getByRole('button', { name });

describe('component: DropdownButton', () => {
  it('should be named by its label and show its children', () => {
    render(DropdownButton, {
      props: { label: 'Sort by: Watchlist', children: menuLabel },
    });

    expect(button('Sort by: Watchlist')).toHaveAttribute('type', 'button');
    expect(button('Sort by: Watchlist')).toHaveTextContent('Watchlist');
  });

  it('should spread the rest of its props on the button', async () => {
    const onclick = vi.fn();
    render(DropdownButton, {
      props: {
        label: 'Filters',
        onclick,
        'aria-haspopup': 'menu',
        children: glyphSnippet,
      },
    });

    await userEvent.click(button('Filters'));

    expect(onclick).toHaveBeenCalledOnce();
    expect(button('Filters')).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('should keep its own class, label and type over spread props', () => {
    // Shaped like the untyped trigger props a `Menu` spreads.
    const triggerProps: Record<string, unknown> = {
      class: 'other',
      'aria-label': 'Other',
      type: 'submit',
    };
    render(DropdownButton, {
      props: { label: 'Filters', children: glyphSnippet, ...triggerProps },
    });

    expect(button('Filters')).toHaveClass('trakt-dropdown-button');
    expect(button('Filters')).not.toHaveClass('other');
    expect(button('Filters')).toHaveAttribute('type', 'button');
  });

  it('should end with a caret hidden from assistive technology', () => {
    render(DropdownButton, {
      props: { label: 'Filters', children: glyphSnippet },
    });

    const caret = button('Filters').lastElementChild;

    expect(caret).toHaveClass('tabler-icon-chevron-down');
    expect(caret).toHaveAttribute('aria-hidden', 'true');
  });

  it.each([
    { selected: true, isSelected: true },
    { selected: false, isSelected: false },
    { selected: undefined, isSelected: false },
  ])(
    'should read as selected only when selected is $selected',
    ({ selected, isSelected }) => {
      render(DropdownButton, {
        props: { label: 'Filters', selected, children: glyphSnippet },
      });

      expect(button('Filters').classList.contains('is-selected')).toBe(
        isSelected,
      );
    },
  );

  it.each([
    { variant: undefined, expected: 'default' },
    { variant: 'icon' as const, expected: 'icon' },
  ])('should take the $expected look', ({ variant, expected }) => {
    render(DropdownButton, {
      props: { label: 'Filters', variant, children: glyphSnippet },
    });

    expect(button('Filters')).toHaveAttribute('data-variant', expected);
  });

  it.each([
    { font: undefined, expected: 'body' },
    { font: 'body' as const, expected: 'body' },
    { font: 'heading' as const, expected: 'heading' },
  ])('should mark font $font as $expected', ({ font, expected }) => {
    render(DropdownButton, {
      props: { label: 'Sort by: Number', font, children: menuLabel },
    });

    expect(button('Sort by: Number')).toHaveAttribute('data-font', expected);
  });
});
