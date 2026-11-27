import { isTriggerChanged } from '$test/beds/subnav/isTriggerChanged.ts';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import SortControls from './SortControls.svelte';
import type { SortControlsProps } from './_internal/SortControlsProps.ts';

type Sort = 'title' | 'added';

const PROPS: SortControlsProps<Sort> = {
  value: 'title',
  choices: [
    { value: 'title', label: 'Title' },
    { value: 'added', label: 'Added Date' },
  ],
  onSelect: () => {},
  pressed: false,
  onReverse: () => {},
};

const toggles = createRawSnippet(() => ({
  render: () => '<button type="button">Eye</button>',
}));

function renderControls(props: Partial<SortControlsProps<Sort>> = {}) {
  return render(SortControls<Sort>, { props: { ...PROPS, ...props } });
}

const button = (name: string) => screen.getByRole('button', { name });

describe('component: SortControls', () => {
  it('should group the direction and the toggles apart from the sort menu', () => {
    renderControls({ toggles });

    const group = button('Direction').closest('.toolbar-toggles');

    expect(group).toContainElement(button('Eye'));
    expect(group).not.toContainElement(button('Sort by: Title'));
  });

  it('should render the toggles after the direction', () => {
    renderControls({ toggles });

    expect(
      button('Direction').compareDocumentPosition(button('Eye')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it.each([true, false])(
    'should mark the direction pressed as %s',
    (pressed) => {
      renderControls({ pressed });

      expect(button('Direction'))
        .toHaveAttribute('aria-pressed', String(pressed));
    },
  );

  it('should report a press of the direction', async () => {
    const onReverse = vi.fn();
    renderControls({ onReverse });

    await userEvent.click(button('Direction'));

    expect(onReverse).toHaveBeenCalledOnce();
  });

  it('should size the menu and the direction for a heading', () => {
    renderControls({ size: 'heading' });

    expect(button('Sort by: Title')).toHaveAttribute('data-font', 'heading');
    expect(button('Direction')).toHaveAttribute('data-size', 'heading');
  });

  it.each([true, false])(
    'should draw the sort menu in the accent while changed is %s',
    (changed) => {
      renderControls({ changed });

      expect(isTriggerChanged('Sort by: Title')).toBe(changed);
    },
  );
});
