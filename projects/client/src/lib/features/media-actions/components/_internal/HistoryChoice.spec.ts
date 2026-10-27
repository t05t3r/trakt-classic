import { render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import HistoryChoice from './HistoryChoice.svelte';

const trigger = () => screen.getByRole('button', { name: 'Add another play' });
const menu = () =>
  screen.queryByRole('menu', { name: 'When did you watch this?' });
const openChoice = async () => {
  await userEvent.click(trigger());
  return screen.findByRole('menu', { name: 'When did you watch this?' });
};

beforeEach(() => {
  stubClientRects();
});

describe('component: HistoryChoice', () => {
  it('should open from its side icon', async () => {
    render(HistoryChoice, { props: { onAdd: vi.fn() } });

    expect(trigger()).toHaveAttribute('title', 'Add another play');
    expect(menu()).not.toBeInTheDocument();

    expect(await openChoice()).toBeVisible();
  });

  it('should align its end with the side icon', async () => {
    render(HistoryChoice, { props: { onAdd: vi.fn() } });
    const choice = await openChoice();

    await waitFor(() => expect(choice).toHaveAttribute('data-align', 'end'));
  });

  it('should offer now and the release date', async () => {
    render(HistoryChoice, { props: { onAdd: vi.fn() } });
    await openChoice();

    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent?.trim()),
    ).toEqual(['Just now', 'Release date']);
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
});
