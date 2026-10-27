import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';
import { ConfirmationType } from './models/ConfirmationType.ts';
import { useConfirm } from './useConfirm.ts';

const REMOVE_PARAMS = {
  type: ConfirmationType.RemoveFromHistory,
  title: 'Heretic',
  count: 3,
};

describe('useConfirm', () => {
  it('should show the dialog with its title, body and both buttons', async () => {
    const { confirmAsync } = await renderStore(useConfirm);

    void confirmAsync(REMOVE_PARAMS);

    const dialog = await screen.findByRole('dialog', {
      name: 'Remove from history?',
    });
    expect(
      within(dialog).getByText(
        'Remove all 3 plays of "Heretic" from your history?',
      ),
    ).toBeVisible();
    expect(
      within(dialog).getByRole('button', { name: 'Remove from History' }),
    ).toBeVisible();
    expect(within(dialog).getByRole('button', { name: 'Cancel' }))
      .toBeVisible();
  });

  it.each([
    {
      type: ConfirmationType.RemoveFromHistory,
      count: 1,
      heading: 'Remove from history?',
      message: 'Remove the play of "Silo" from your history?',
      button: 'Remove from History',
    },
    {
      type: ConfirmationType.RemoveFromHistory,
      count: 12,
      heading: 'Remove from history?',
      message: 'Remove all 12 plays of "Silo" from your history?',
      button: 'Remove from History',
    },
    {
      type: ConfirmationType.MarkShowWatched,
      count: 1,
      heading: 'Mark as watched?',
      message:
        'Mark the one aired episode of "Silo" as watched? If it is already watched, it gets another play.',
      button: 'Mark as Watched',
    },
    {
      type: ConfirmationType.MarkShowWatched,
      count: 20,
      heading: 'Mark as watched?',
      message:
        'Mark all 20 aired episodes of "Silo" as watched? Episodes already watched get another play.',
      button: 'Mark as Watched',
    },
  ])(
    'should word $type for a count of $count',
    async ({ type, count, heading, message, button }) => {
      const { confirmAsync } = await renderStore(useConfirm);

      void confirmAsync({ type, title: 'Silo', count });

      const dialog = await screen.findByRole('dialog', { name: heading });
      expect(within(dialog).getByText(message)).toBeVisible();
      expect(within(dialog).getByRole('button', { name: button }))
        .toBeVisible();
    },
  );

  describe('confirmAsync', () => {
    it('should resolve true when the action is confirmed', async () => {
      const { confirmAsync } = await renderStore(useConfirm);

      const result = confirmAsync(REMOVE_PARAMS);
      await userEvent.click(
        await screen.findByRole('button', { name: 'Remove from History' }),
      );

      await expect(result).resolves.toBe(true);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should resolve false when Cancel is clicked', async () => {
      const { confirmAsync } = await renderStore(useConfirm);

      const result = confirmAsync(REMOVE_PARAMS);
      await userEvent.click(
        await screen.findByRole('button', { name: 'Cancel' }),
      );

      await expect(result).resolves.toBe(false);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should resolve false when Escape is pressed', async () => {
      const { confirmAsync } = await renderStore(useConfirm);

      const result = confirmAsync(REMOVE_PARAMS);
      await screen.findByRole('dialog');
      await userEvent.keyboard('{Escape}');

      await expect(result).resolves.toBe(false);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should resolve false when the close button is clicked', async () => {
      const { confirmAsync } = await renderStore(useConfirm);

      const result = confirmAsync(REMOVE_PARAMS);
      await userEvent.click(
        await screen.findByRole('button', { name: 'Close' }),
      );

      await expect(result).resolves.toBe(false);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should resolve false when the backdrop is clicked', async () => {
      const { confirmAsync } = await renderStore(useConfirm);

      const result = confirmAsync(REMOVE_PARAMS);
      await screen.findByRole('dialog');
      // jsdom lays the dialog out at 0,0, so a press at 1,1 lands outside it.
      await userEvent.pointer({
        keys: '[MouseLeft]',
        target: assertDefined(document.querySelector('.trakt-modal-overlay')),
        coords: { clientX: 1, clientY: 1 },
      });

      await expect(result).resolves.toBe(false);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should resolve false for a request raised while another is open', async () => {
      const { confirmAsync } = await renderStore(useConfirm);

      const first = confirmAsync(REMOVE_PARAMS);
      await screen.findByRole('dialog', { name: 'Remove from history?' });
      const second = confirmAsync({
        type: ConfirmationType.MarkShowWatched,
        title: 'Silo',
        count: 20,
      });

      await expect(second).resolves.toBe(false);
      await tick();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAccessibleName('Remove from history?');
      expect(
        within(dialog).getByText(
          'Remove all 3 plays of "Heretic" from your history?',
        ),
      ).toBeVisible();
      await userEvent.click(
        screen.getByRole('button', { name: 'Remove from History' }),
      );
      await expect(first).resolves.toBe(true);
    });
  });
});
