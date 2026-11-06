import { goto } from '$app/navigation';
import { openMenuByClick } from '$test/beds/menus/openMenuByClick.ts';
import { readMenuRows } from '$test/beds/menus/readMenuRows.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MoreActionsMenu from './MoreActionsMenu.svelte';

const MOVIE = { type: 'movie', id: 12 } as const;
const SHOW = { type: 'show', id: 12 } as const;
const ACTION = () => Promise.resolve(true);

const openMore = () => openMenuByClick('More actions', 'More actions');

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

  it('should run onDrop from Drop show', async () => {
    const onDrop = vi.fn(ACTION);
    render(MoreActionsMenu, {
      props: { target: SHOW, hasHistory: true, onDrop },
    });
    await openMore();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Drop show' }));

    expect(onDrop).toHaveBeenCalledOnce();
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
