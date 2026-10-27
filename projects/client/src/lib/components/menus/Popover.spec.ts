import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import PopoverHost from '$test/beds/menus/PopoverHost.svelte';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';

const trigger = () => screen.getByRole('button', { name: 'Rate' });
const dialog = () => screen.queryByRole('dialog', { name: 'Your rating' });
const openPopover = async () => {
  await userEvent.click(trigger());
  const opened = await screen.findByRole('dialog', { name: 'Your rating' });
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Weak' })).toHaveFocus()
  );
  return opened;
};

beforeEach(() => {
  stubClientRects();
});

describe('component: Popover', () => {
  it('should open from the trigger as a dialog named by its label', async () => {
    render(PopoverHost);

    expect(dialog()).not.toBeInTheDocument();

    await userEvent.click(trigger());

    expect(await screen.findByRole('dialog', { name: 'Your rating' }))
      .toBeVisible();
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
  });

  it('should name its dialog in the open trigger', async () => {
    render(PopoverHost);

    const opened = await openPopover();
    const controlled = trigger().getAttribute('aria-controls');

    expect(controlled).toBeTruthy();
    expect(document.getElementById(controlled ?? '')).toBe(opened);
  });

  it.each([['Enter', '{Enter}'], ['Space', ' ']])(
    'should open with %s and focus its first control',
    async (_name, key) => {
      render(PopoverHost);
      trigger().focus();

      await userEvent.keyboard(key);

      expect(await screen.findByRole('dialog', { name: 'Your rating' }))
        .toBeVisible();
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Weak' })).toHaveFocus()
      );
    },
  );

  it('should render outside the container of its trigger', async () => {
    const { container } = render(PopoverHost);

    const opened = await openPopover();

    expect(container.contains(trigger())).toBe(true);
    expect(container.contains(opened)).toBe(false);
  });

  it('should close on Escape and focus the trigger', async () => {
    render(PopoverHost);
    await openPopover();

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    expect(trigger()).toHaveFocus();
  });

  it('should close on a press outside and focus the trigger', async () => {
    render(PopoverHost);
    await openPopover();

    // bits-ui counts a press within the box's rect as inside, and jsdom puts that rect at 0,0.
    fireEvent.pointerDown(document.body, { clientX: 1, clientY: 1 });

    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    expect(trigger()).toHaveFocus();
  });

  it('should close when its content sets open to false and focus the trigger', async () => {
    render(PopoverHost);
    await openPopover();

    await userEvent.click(screen.getByRole('button', { name: 'Strong' }));

    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    expect(trigger()).toHaveFocus();
  });

  it.each(
    [
      [undefined, 'bottom'],
      ['top', 'top'],
      ['bottom', 'bottom'],
    ] as const,
  )('should open on side %s as %s', async (side, placed) => {
    render(PopoverHost, { props: { side } });

    expect(await openPopover()).toHaveAttribute('data-side', placed);
  });
});
