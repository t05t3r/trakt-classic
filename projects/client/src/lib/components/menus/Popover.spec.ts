import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { controlledBy } from '$test/beds/dom/controlledBy.ts';
import { mountElement } from '$test/beds/dom/mountElement.ts';
import AnchoredPopoverHost from '$test/beds/menus/AnchoredPopoverHost.svelte';
import { closeFromOutside } from '$test/beds/menus/closeFromOutside.ts';
import { openDialogByClick } from '$test/beds/menus/openDialogByClick.ts';
import PopoverHost from '$test/beds/menus/PopoverHost.svelte';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { nextFrame } from '$test/beds/promise/nextFrame.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { openMenuIn } from './openMenus.ts';

const trigger = () => screen.getByRole('button', { name: 'Rate' });
const dialog = () => screen.queryByRole('dialog', { name: 'Your rating' });
const openPopover = async () => {
  const opened = await openDialogByClick('Rate', 'Your rating');
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Weak' })).toHaveFocus()
  );
  return opened;
};

// The trap sends any focus outside its content back, unless a layer the press opened has paused it.
const focusPastTrap = (element: HTMLElement) => {
  window.addEventListener(
    'focusin',
    (event) => event.stopImmediatePropagation(),
    { capture: true, once: true },
  );
  element.focus();
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

  it('should close on a press on another control and focus that control', async () => {
    const other = mountElement('button');
    render(PopoverHost);
    await openPopover();

    await closeFromOutside(dialog, other);

    expect(other).toHaveFocus();
  });

  it('should focus the control around what a press landed on', async () => {
    const other = mountElement('button');
    const icon = mountElement('span', other);
    render(PopoverHost);
    await openPopover();

    await closeFromOutside(dialog, icon);

    expect(other).toHaveFocus();
  });

  it('should leave the focus on what a press on another control moved it to', async () => {
    const other = mountElement('button');
    const taker = mountElement('button');
    other.addEventListener('pointerdown', () => focusPastTrap(taker), {
      once: true,
    });
    render(PopoverHost);
    await openPopover();

    // bits-ui's focus scope remounts just after the open and focuses the content again on the next frame.
    await nextFrame();
    await closeFromOutside(dialog, other);

    expect(taker).toHaveFocus();
  });

  it('should focus another control when a press on it found no focus at all', async () => {
    const other = mountElement('button');
    render(PopoverHost);
    await openPopover();

    screen.getByRole('button', { name: 'Weak' }).blur();
    await closeFromOutside(dialog, other);

    expect(other).toHaveFocus();
  });

  it('should focus the trigger on Escape when the focus has left the content', async () => {
    const taker = mountElement('button');
    render(PopoverHost);
    await openPopover();

    // bits-ui's focus scope remounts just after the open and focuses the content again on the next frame.
    await nextFrame();
    focusPastTrap(taker);
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    expect(trigger()).toHaveFocus();
  });

  it('should close on a press on plain content and focus the trigger', async () => {
    const content = mountElement('p');
    render(PopoverHost);
    await openPopover();

    await closeFromOutside(dialog, content);

    expect(trigger()).toHaveFocus();
  });

  it('should close on a press on its trigger and focus it', async () => {
    render(PopoverHost);
    await openPopover();

    const pressLeavesItOpen = async () => {
      fireEvent.pointerDown(trigger(), { clientX: 1, clientY: 1 });
      await waitNegativeClaim();
      expect(dialog()).toBeInTheDocument();
    };

    // bits-ui drops a press made before its outside-press listener is on, so only the second is sure to land.
    await pressLeavesItOpen();
    await pressLeavesItOpen();
    fireEvent.click(trigger());

    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    expect(trigger()).toHaveFocus();
  });

  it('should focus the trigger on Escape after a press on another control closed it', async () => {
    const other = mountElement('button');
    render(PopoverHost);
    await openPopover();
    await closeFromOutside(dialog, other);

    await openPopover();
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    expect(trigger()).toHaveFocus();
  });

  it('should focus the trigger on Escape when the focus was elsewhere at the open', async () => {
    const other = mountElement('button');
    render(PopoverHost);
    other.focus();

    fireEvent.click(trigger());
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Weak' })).toHaveFocus()
    );
    await userEvent.keyboard('{Escape}');

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

  describe('anchored', () => {
    const anchor = (name = 'First anchor') =>
      screen.getByRole('button', { name });
    const openAnchored = async () => {
      const opened = await openDialogByClick('Open', 'Your rating');
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Weak' })).toHaveFocus()
      );
      return opened;
    };

    it('should open from its parent with no trigger of its own', async () => {
      render(AnchoredPopoverHost);

      expect(dialog()).not.toBeInTheDocument();
      expect(await openAnchored()).toBeVisible();
      expect(anchor()).not.toHaveAttribute('aria-haspopup');
      expect(anchor()).not.toHaveAttribute('aria-expanded');
    });

    it('should close on Escape and focus the anchor', async () => {
      render(AnchoredPopoverHost);
      await openAnchored();

      await userEvent.keyboard('{Escape}');

      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      expect(anchor()).toHaveFocus();
    });

    it('should close on a press outside and focus the anchor', async () => {
      render(AnchoredPopoverHost);
      await openAnchored();

      await closeFromOutside(dialog);

      expect(anchor()).toHaveFocus();
    });

    it('should close on a press on the anchor and focus it', async () => {
      render(AnchoredPopoverHost);
      await openAnchored();

      // bits-ui re-attaches its outside-press listener just after the open and drops a press made before it.
      await waitFor(() => {
        fireEvent.pointerDown(anchor(), { clientX: 1, clientY: 1 });
        expect(dialog()).not.toBeInTheDocument();
      });

      expect(anchor()).toHaveFocus();
    });

    it('should close on a press on another control and focus that control', async () => {
      const other = mountElement('button');
      render(AnchoredPopoverHost);
      await openAnchored();

      await closeFromOutside(dialog, other);

      expect(other).toHaveFocus();
    });

    it('should leave the focus on what a press on another control moved it to', async () => {
      const other = mountElement('button');
      const taker = mountElement('button');
      other.addEventListener('pointerdown', () => focusPastTrap(taker), {
        once: true,
      });
      render(AnchoredPopoverHost);
      await openAnchored();

      // bits-ui's focus scope remounts just after the open and focuses the content again on the next frame.
      await nextFrame();
      await closeFromOutside(dialog, other);

      expect(taker).toHaveFocus();
    });

    it('should focus the anchor on Escape after a press on another control closed it', async () => {
      const other = mountElement('button');
      render(AnchoredPopoverHost);
      await openAnchored();
      await closeFromOutside(dialog, other);

      await openAnchored();
      await userEvent.keyboard('{Escape}');

      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      expect(anchor()).toHaveFocus();
    });

    it('should close when its content sets open to false and focus the anchor', async () => {
      render(AnchoredPopoverHost);
      await openAnchored();

      await userEvent.click(screen.getByRole('button', { name: 'Strong' }));

      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      expect(anchor()).toHaveFocus();
    });

    it('should focus the anchor as it stands at the close', async () => {
      const { rerender } = render(AnchoredPopoverHost);
      await openAnchored();

      await rerender({ isSwapped: true });
      await userEvent.keyboard('{Escape}');

      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      expect(anchor('Second anchor')).toHaveFocus();
    });

    it('should hold as an open menu of its anchor only while open', async () => {
      const { container } = render(AnchoredPopoverHost);

      expect(openMenuIn(container)).toBeUndefined();

      const opened = await openAnchored();

      expect(openMenuIn(container)?.trigger).toBe(anchor());
      expect(openMenuIn(container)?.contains(opened)).toBe(true);

      await userEvent.keyboard('{Escape}');

      await waitFor(() => expect(openMenuIn(container)).toBeUndefined());
    });

    it('should close from the hold it gives the open menus', async () => {
      const { container } = render(AnchoredPopoverHost);
      await openAnchored();

      openMenuIn(container)?.close();

      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    });
  });
});
