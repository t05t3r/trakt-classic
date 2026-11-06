import { goto } from '$app/navigation';
import { fixNow } from '$test/beds/date/fixNow.ts';
import { applyDateField } from '$test/beds/forms/applyDateField.ts';
import { DATE_FIELD_CLOSES } from '$test/beds/forms/DATE_FIELD_CLOSES.ts';
import { dateField } from '$test/beds/forms/dateField.ts';
import { dateFieldDialog } from '$test/beds/forms/dateFieldDialog.ts';
import { openMenuByClick } from '$test/beds/menus/openMenuByClick.ts';
import { readMenuRows } from '$test/beds/menus/readMenuRows.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MoreActionsMenu from './MoreActionsMenu.svelte';

const MOVIE = { type: 'movie', id: 12 } as const;
const SHOW = { type: 'show', id: 12 } as const;
const ACTION = () => Promise.resolve(true);

const openMore = () => openMenuByClick('More actions', 'More actions');
const trigger = () => screen.getByRole('button', { name: 'More actions' });
const fieldDialog = () => dateFieldDialog('When did you drop this?');
const field = () => dateField('When did you drop this?');

const openField = async () => {
  await openMore();
  await userEvent.click(screen.getByRole('menuitem', { name: 'Drop show' }));
  await waitFor(() => expect(field()).toHaveFocus());
};

const renderDrop = () => {
  const onDrop = vi.fn(ACTION);
  render(MoreActionsMenu, {
    props: { target: SHOW, hasHistory: true, onDrop },
  });

  return onDrop;
};

beforeEach(() => {
  stubClientRects();
});

describe('component: MoreActionsMenu', () => {
  it('should hold View history, aligned to the side icon', async () => {
    render(MoreActionsMenu, { props: { target: MOVIE, hasHistory: true } });

    const menu = await openMore();

    expect(readMenuRows()).toEqual(['View history']);
    await waitFor(() => expect(menu).toHaveAttribute('data-align', 'end'));
  });

  it.each(
    [
      { type: 'movie', url: '/users/me/history?movie=12' },
      { type: 'episode', url: '/users/me/history?episode=12' },
      { type: 'show', url: '/users/me/history/episodes?show=12' },
      { type: 'season', url: '/users/me/history/episodes?season=12' },
    ] as const,
  )("should open a $type's history at $url", async ({ type, url }) => {
    render(MoreActionsMenu, {
      props: { target: { type, id: 12 }, hasHistory: true },
    });
    await openMore();

    await userEvent.click(screen.getByRole('menuitem'));

    expect(vi.mocked(goto)).toHaveBeenLastCalledWith(url);
  });

  it('should read View history, then Drop show', async () => {
    render(MoreActionsMenu, {
      props: { target: SHOW, hasHistory: true, onDrop: ACTION },
    });

    await openMore();

    expect(readMenuRows()).toEqual(['View history', 'Drop show']);
  });

  it('should read View history, then Restore show', async () => {
    render(MoreActionsMenu, {
      props: { target: SHOW, hasHistory: true, onRestore: ACTION },
    });

    await openMore();

    expect(readMenuRows()).toEqual(['View history', 'Restore show']);
  });

  it('should hold Restore show alone with no history to view', async () => {
    render(MoreActionsMenu, {
      props: { target: SHOW, hasHistory: false, onRestore: ACTION },
    });

    await openMore();

    expect(readMenuRows()).toEqual(['Restore show']);
  });

  it('should offer no trigger with no row to hold', () => {
    render(MoreActionsMenu, { props: { target: SHOW, hasHistory: false } });

    expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull();
  });

  describe('Drop show', () => {
    it('should open the field and run nothing by itself', async () => {
      const onDrop = renderDrop();

      await openField();
      await waitNegativeClaim();

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(fieldDialog()).toBeVisible();
      expect(onDrop).not.toHaveBeenCalled();
    });

    it('should run onDrop with the current minute alone on Apply at the default', async () => {
      fixNow(new Date('2026-03-15T09:41:27.000Z'));
      const onDrop = renderDrop();
      await openField();

      await applyDateField();

      expect(onDrop.mock.calls).toEqual([[
        new Date('2026-03-15T09:41:00.000Z'),
      ]]);
    });

    it('should run onDrop with a past date on Apply and return the focus to the trigger', async () => {
      const onDrop = renderDrop();
      await openField();

      await fireEvent.input(field(), { target: { value: '2026-01-15T12:00' } });
      await applyDateField();

      await waitFor(() => expect(fieldDialog()).not.toBeInTheDocument());
      expect(onDrop.mock.calls).toEqual([[
        new Date('2026-01-15T12:00:00.000Z'),
      ]]);
      expect(trigger()).toHaveFocus();
    });

    it('should run nothing for a future date and stay open', async () => {
      fixNow(new Date('2026-03-15T09:41:27.000Z'));
      const onDrop = renderDrop();
      await openField();

      await fireEvent.input(field(), { target: { value: '2026-03-15T09:42' } });
      await applyDateField();
      await waitNegativeClaim();

      expect(onDrop).not.toHaveBeenCalled();
      expect(fieldDialog()).toBeVisible();
    });

    it('should keep the menu shut while the field is open', async () => {
      renderDrop();
      await openField();

      expect(trigger()).toHaveAttribute('aria-disabled', 'true');

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await waitFor(() => expect(fieldDialog()).not.toBeInTheDocument());

      expect(trigger()).not.toHaveAttribute('aria-disabled');
    });

    it.each(DATE_FIELD_CLOSES)(
      'should return the focus to the trigger on $name and run nothing',
      async ({ close }) => {
        const onDrop = renderDrop();
        await openField();

        await close();

        await waitFor(() => expect(fieldDialog()).not.toBeInTheDocument());
        expect(trigger()).toHaveFocus();
        await waitNegativeClaim();
        expect(onDrop).not.toHaveBeenCalled();
      },
    );

    it('should close, run nothing and focus the trigger when the row goes away', async () => {
      const onDrop = vi.fn(ACTION);
      const { rerender } = render(MoreActionsMenu, {
        props: { target: SHOW, hasHistory: true, onDrop },
      });
      await openField();

      await rerender({ onDrop: undefined });

      await waitFor(() => expect(fieldDialog()).not.toBeInTheDocument());
      await waitFor(() => expect(trigger()).toHaveFocus());
      await waitNegativeClaim();
      expect(onDrop).not.toHaveBeenCalled();
    });

    it('should close and run nothing when the trigger goes away with the row', async () => {
      const onDrop = vi.fn(ACTION);
      const { rerender } = render(MoreActionsMenu, {
        props: { target: SHOW, hasHistory: false, onDrop },
      });
      await openField();

      await rerender({ onDrop: undefined });

      await waitFor(() => expect(fieldDialog()).not.toBeInTheDocument());
      expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull();
      await waitNegativeClaim();
      expect(onDrop).not.toHaveBeenCalled();
    });
  });

  it('should run onRestore from Restore show', async () => {
    const onRestore = vi.fn(ACTION);
    render(MoreActionsMenu, {
      props: { target: SHOW, hasHistory: true, onRestore },
    });
    await openMore();

    await userEvent.click(
      screen.getByRole('menuitem', { name: 'Restore show' }),
    );

    expect(onRestore).toHaveBeenCalledOnce();
  });
});
