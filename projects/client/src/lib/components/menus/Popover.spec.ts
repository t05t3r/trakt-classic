import { render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { controlledBy } from '$test/beds/dom/controlledBy.ts';
import { closeFromOutside } from '$test/beds/menus/closeFromOutside.ts';
import { openDialogByClick } from '$test/beds/menus/openDialogByClick.ts';
import PopoverHost from '$test/beds/menus/PopoverHost.svelte';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';

const trigger = () => screen.getByRole('button', { name: 'Rate' });
const dialog = () => screen.queryByRole('dialog', { name: 'Your rating' });
const openPopover = async () => {
  const opened = await openDialogByClick('Rate', 'Your rating');
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

    expect(await openDialogByClick('Rate', 'Your rating')).toBeVisible();
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
  });

  it('should name its dialog in the open trigger', async () => {
    render(PopoverHost);

    const opened = await openPopover();

    expect(controlledBy(trigger())).toBe(opened);
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

    await closeFromOutside(dialog);
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

  it.each(
    [
      [undefined, 'default'],
      ['default', 'default'],
      ['flush', 'flush'],
    ] as const,
  )('should take variant %s as %s', async (variant, shown) => {
    render(PopoverHost, { props: { variant } });

    expect(await openPopover()).toHaveAttribute('data-variant', shown);
  });
});
