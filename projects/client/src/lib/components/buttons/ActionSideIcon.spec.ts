import { render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import IconCirclePlus from '@tabler/icons-svelte/icons/circle-plus';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ActionSideIconMenuHost from '$test/beds/buttons/ActionSideIconMenuHost.svelte';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import ActionSideIcon from './ActionSideIcon.svelte';

beforeEach(() => {
  stubClientRects();
});

describe('component: ActionSideIcon', () => {
  it('should carry its label as accessible name and, on hover, in a tooltip', async () => {
    render(ActionSideIcon, {
      props: { icon: IconCirclePlus, label: 'Add another play' },
    });

    const button = screen.getByRole('button', { name: 'Add another play' });
    await userEvent.hover(button);

    await waitFor(() =>
      expect(button).toHaveAccessibleDescription('Add another play')
    );
    expect(button).not.toHaveAttribute('title');
    expect(button).toHaveAttribute('type', 'button');
    expect(button.querySelector('.tabler-icon-circle-plus')).not.toBeNull();
  });

  it('should spread the rest of its props on the button', async () => {
    const onclick = vi.fn();
    render(ActionSideIcon, {
      props: {
        icon: IconCirclePlus,
        label: 'Drop',
        onclick,
        'aria-haspopup': 'menu',
      },
    });

    const button = screen.getByRole('button', { name: 'Drop' });
    await userEvent.click(button);

    expect(onclick).toHaveBeenCalledOnce();
    expect(button).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('should keep its own class, label and type over spread props', () => {
    // Shaped like the untyped trigger props a `Menu` spreads.
    const triggerProps: Record<string, unknown> = {
      class: 'other',
      'aria-label': 'Other',
      type: 'submit',
    };
    render(ActionSideIcon, {
      props: { icon: IconCirclePlus, label: 'Drop', ...triggerProps },
    });

    const button = screen.getByRole('button', { name: 'Drop' });

    expect(button).toHaveClass('trakt-action-side-icon');
    expect(button).not.toHaveClass('other');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should stay out of reach with no tooltip while disabled', async () => {
    render(ActionSideIcon, {
      props: { icon: IconCirclePlus, label: 'Drop', disabled: true },
    });

    const button = screen.getByRole('button', { name: 'Drop' });
    await userEvent.hover(button);

    await waitNegativeClaim();
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription('');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('should hide its glyph from assistive technology', () => {
    const { container } = render(ActionSideIcon, {
      props: { icon: IconCirclePlus, label: 'Drop' },
    });

    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('should open a menu as its trigger', async () => {
    render(ActionSideIconMenuHost);

    const trigger = screen.getByRole('button', { name: 'Add to list' });
    await userEvent.click(trigger);

    expect(await screen.findByRole('menu', { name: 'Lists' })).toBeVisible();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
