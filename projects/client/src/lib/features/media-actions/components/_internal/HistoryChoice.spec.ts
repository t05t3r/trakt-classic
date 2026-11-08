import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fixNow } from '$test/beds/date/fixNow.ts';
import { applyDateField } from '$test/beds/forms/applyDateField.ts';
import { DATE_FIELD_CLOSES } from '$test/beds/forms/DATE_FIELD_CLOSES.ts';
import { dateField } from '$test/beds/forms/dateField.ts';
import { dateFieldDialog } from '$test/beds/forms/dateFieldDialog.ts';
import { openMenuByClick } from '$test/beds/menus/openMenuByClick.ts';
import { readMenuRows } from '$test/beds/menus/readMenuRows.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import HistoryChoice from './HistoryChoice.svelte';

const trigger = () => screen.getByRole('button', { name: 'Add another play' });
const menu = () =>
  screen.queryByRole('menu', { name: 'When did you watch this?' });
const openChoice = () =>
  openMenuByClick('Add another play', 'When did you watch this?');
const fieldDialog = () => dateFieldDialog('When did you watch this?');
const field = () => dateField('When did you watch this?');

const openField = async () => {
  await openChoice();
  await userEvent.click(screen.getByRole('menuitem', { name: 'Other date' }));
  await waitFor(() => expect(field()).toHaveFocus());
};

beforeEach(() => {
  stubClientRects();
});

describe('component: HistoryChoice', () => {
  it('should open from its side icon', async () => {
    render(HistoryChoice, { props: { onAdd: vi.fn() } });

    expect(trigger()).toHaveAccessibleName('Add another play');
    expect(menu()).not.toBeInTheDocument();

    expect(await openChoice()).toBeVisible();
  });

  it('should align its end with the side icon', async () => {
    render(HistoryChoice, { props: { onAdd: vi.fn() } });
    const choice = await openChoice();

    await waitFor(() => expect(choice).toHaveAttribute('data-align', 'end'));
  });

  it('should offer now, the release date and another date', async () => {
    render(HistoryChoice, { props: { onAdd: vi.fn() } });
    await openChoice();

    expect(readMenuRows()).toEqual(['Just now', 'Release date', 'Other date']);
  });

  it.each([
    ['Just now', 'now'],
    ['Release date', 'released'],
  ])('should add at %s and close', async (row, at) => {
    const onAdd = vi.fn();
    render(HistoryChoice, { props: { onAdd } });
    await openChoice();

    await userEvent.click(screen.getByRole('menuitem', { name: row }));

    expect(onAdd).toHaveBeenCalledExactlyOnceWith(at);
    await waitFor(() => expect(menu()).not.toBeInTheDocument());
  });

  describe('on Other date', () => {
    it('should close the menu, open the field and add nothing', async () => {
      const onAdd = vi.fn();
      render(HistoryChoice, { props: { onAdd } });

      await openField();

      await waitFor(() => expect(menu()).not.toBeInTheDocument());
      expect(fieldDialog()).toBeVisible();
      await waitNegativeClaim();
      expect(onAdd).not.toHaveBeenCalled();
    });

    it('should add at the current minute on Apply at the default', async () => {
      fixNow(new Date('2026-03-15T09:41:27.000Z'));
      const onAdd = vi.fn();
      render(HistoryChoice, { props: { onAdd } });
      await openField();

      await applyDateField();

      expect(onAdd.mock.calls).toEqual([[
        new Date('2026-03-15T09:41:00.000Z'),
      ]]);
    });

    it('should add at a past date on Apply and return the focus to its icon', async () => {
      const onAdd = vi.fn();
      render(HistoryChoice, { props: { onAdd } });
      await openField();

      await fireEvent.input(field(), { target: { value: '2026-01-15T12:00' } });
      await applyDateField();

      await waitFor(() => expect(fieldDialog()).not.toBeInTheDocument());
      expect(onAdd.mock.calls).toEqual([[
        new Date('2026-01-15T12:00:00.000Z'),
      ]]);
      expect(trigger()).toHaveFocus();
    });

    it('should add nothing for a future date and stay open', async () => {
      fixNow(new Date('2026-03-15T09:41:27.000Z'));
      const onAdd = vi.fn();
      render(HistoryChoice, { props: { onAdd } });
      await openField();

      await fireEvent.input(field(), { target: { value: '2026-03-15T09:42' } });
      await applyDateField();
      await waitNegativeClaim();

      expect(onAdd).not.toHaveBeenCalled();
      expect(fieldDialog()).toBeVisible();
    });

    it('should keep the menu shut while the field is open', async () => {
      render(HistoryChoice, { props: { onAdd: vi.fn() } });
      await openField();

      expect(trigger()).toHaveAttribute('aria-disabled', 'true');

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await waitFor(() => expect(fieldDialog()).not.toBeInTheDocument());

      expect(trigger()).not.toHaveAttribute('aria-disabled');
    });

    it.each(DATE_FIELD_CLOSES)(
      'should return the focus to its icon on $name and add nothing',
      async ({ close }) => {
        const onAdd = vi.fn();
        render(HistoryChoice, { props: { onAdd } });
        await openField();

        await close();

        await waitFor(() => expect(fieldDialog()).not.toBeInTheDocument());
        expect(trigger()).toHaveFocus();
        await waitNegativeClaim();
        expect(onAdd).not.toHaveBeenCalled();
      },
    );
  });
});
