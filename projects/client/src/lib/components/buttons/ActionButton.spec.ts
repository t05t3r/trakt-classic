import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import IconCheck from '@tabler/icons-svelte/icons/check';
import { describe, expect, it, vi } from 'vitest';
import ActionButtonHost from '$test/beds/buttons/ActionButtonHost.svelte';
import ActionButton from './ActionButton.svelte';

function renderActionButton(
  props: {
    selected?: boolean;
    isUpdating?: boolean;
    isInert?: boolean;
    underInfo?: string;
  } = {},
) {
  const onclick = vi.fn();
  const { container } = render(ActionButton, {
    props: {
      color: 'watch',
      icon: IconCheck,
      label: 'Add to history',
      onclick,
      ...props,
    },
  });
  const root = container.querySelector('.trakt-action-button');

  return { onclick, root, container };
}

const mainButton = () => screen.getByRole('button', { name: /history/i });

describe('component: ActionButton', () => {
  it('should show its label and colour', () => {
    const { root } = renderActionButton({ selected: false });

    expect(mainButton()).toHaveTextContent('Add to history');
    expect(root).toHaveAttribute('data-color', 'watch');
  });

  it.each([
    [true, true],
    [false, false],
    [undefined, false],
  ])('should show selected %s as selected: %s', (selected, isSelected) => {
    const { root } = renderActionButton({ selected });

    expect(root?.classList.contains('is-selected')).toBe(isSelected);
  });

  it.each([true, false])(
    'should call onclick when selected is %s',
    async (selected) => {
      const { onclick } = renderActionButton({ selected });

      await userEvent.click(mainButton());

      expect(onclick).toHaveBeenCalledOnce();
    },
  );

  it('should ignore a click while its state is unknown', async () => {
    const { onclick } = renderActionButton({ selected: undefined });

    await userEvent.click(mainButton());

    expect(onclick).not.toHaveBeenCalled();
  });

  it.each([
    [undefined, 'true'],
    [true, 'false'],
    [false, 'false'],
  ])(
    'should mark itself disabled only while its state is unknown, selected %s',
    (selected, ariaDisabled) => {
      renderActionButton({ selected });

      expect(mainButton()).toHaveAttribute('aria-disabled', ariaDisabled);
    },
  );

  it.each([true, false])(
    'should ignore a click while inert, selected %s',
    async (selected) => {
      const { onclick } = renderActionButton({ selected, isInert: true });

      await userEvent.click(mainButton());

      expect(onclick).not.toHaveBeenCalled();
      expect(mainButton()).toHaveAttribute('aria-disabled', 'true');
    },
  );

  it('should keep showing its selected state while inert', () => {
    const { root } = renderActionButton({ selected: true, isInert: true });

    expect(root).toHaveClass('is-selected');
  });

  it('should show its glyph when idle', () => {
    const { container } = renderActionButton({ selected: false });

    expect(container.querySelector('.tabler-icon-check')).not.toBeNull();
    expect(container.querySelector('.tabler-icon-loader-2')).toBeNull();
    expect(mainButton()).toHaveAttribute('aria-busy', 'false');
  });

  it('should swap its glyph for a spinner while updating', () => {
    const { container } = renderActionButton({
      selected: false,
      isUpdating: true,
    });

    expect(container.querySelector('.tabler-icon-check')).toBeNull();
    expect(container.querySelector('.tabler-icon-loader-2')).toHaveClass(
      'trakt-pending-spinner',
    );
    expect(mainButton()).toHaveAttribute('aria-busy', 'true');
  });

  it('should show the under-info line when it has a value', () => {
    renderActionButton({
      selected: true,
      underInfo: '1 play · last 6 Jul 2026',
    });

    expect(mainButton()).toHaveTextContent('1 play · last 6 Jul 2026');
  });

  it('should leave the under-info line out without a value', () => {
    const { container } = renderActionButton({ selected: true });

    expect(container.querySelector('.action-button-under-info')).toBeNull();
  });

  it.each([true, false])(
    'should mark its text as two-line while the under-info line renders, selected %s',
    (selected) => {
      const { container } = renderActionButton({
        selected,
        underInfo: 'Added 6 Jul 2026',
      });

      expect(container.querySelector('.action-button-text')).toHaveClass(
        'has-under-info',
      );
    },
  );

  it('should not mark its text as two-line without an under-info line', () => {
    const { container } = renderActionButton({ selected: true });

    expect(container.querySelector('.action-button-text')).not.toHaveClass(
      'has-under-info',
    );
  });

  it('should lay its side icons beside the main button, not inside it', async () => {
    const onclick = vi.fn();
    const onside = vi.fn();
    const { container } = render(ActionButtonHost, {
      props: { onclick, onside },
    });

    expect(container.querySelector('button button')).toBeNull();
    expect(
      [...container.querySelectorAll('.action-button-side > button')].map((
        button,
      ) => button.getAttribute('aria-label')),
    ).toEqual(['Add another play', 'Drop']);

    await userEvent.click(screen.getByRole('button', { name: 'Drop' }));

    expect(onside).toHaveBeenCalledExactlyOnceWith('drop');
    expect(onclick).not.toHaveBeenCalled();
  });
});
