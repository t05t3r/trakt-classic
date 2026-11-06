import { emulateFocusVisible } from '$test/beds/focus/emulateFocusVisible.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import TooltipHost from '$test/beds/tooltip/TooltipHost.svelte';
import TooltipMenuHost from '$test/beds/tooltip/TooltipMenuHost.svelte';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const press = () => screen.getByRole('button', { name: 'Press' });
const rank = () => screen.getByRole('button', { name: 'Rank' });
const menu = () => screen.queryByRole('menu', { name: 'Sort by' });

const isShown = () =>
  waitFor(() => expect(press()).toHaveAccessibleDescription('Why it is'));

describe('component: Tooltip', () => {
  beforeEach(() => {
    stubClientRects();
  });

  it('should describe its trigger on a mouse hover', async () => {
    render(TooltipHost);

    await userEvent.hover(press());

    await isShown();
  });

  it('should open on the keyboard focus, adding no tab stop', async () => {
    render(TooltipHost);

    await userEvent.tab();

    expect(press()).toHaveFocus();
    await isShown();

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
    await waitFor(() => expect(press()).not.toHaveAccessibleDescription());
  });

  it('should add no wrapper around its trigger', () => {
    const { container } = render(TooltipHost);

    expect(press().parentElement).toBe(container);
  });

  it('should stay shut on a touch hover', async () => {
    render(TooltipHost);

    await fireEvent.pointerEnter(press(), { pointerType: 'touch' });
    await fireEvent.pointerMove(press(), { pointerType: 'touch' });
    await waitNegativeClaim();

    expect(press()).not.toHaveAccessibleDescription();
  });

  it('should open on a mouse pointer the same events carry', async () => {
    render(TooltipHost);

    await fireEvent.pointerEnter(press(), { pointerType: 'mouse' });

    await isShown();
  });

  it("should stay shut on a focus that is not the keyboard's", async () => {
    emulateFocusVisible();
    render(TooltipHost);

    press().focus();
    await waitNegativeClaim();

    expect(press()).toHaveFocus();
    expect(press()).not.toHaveAccessibleDescription();
  });

  it('should stay shut while disabled', async () => {
    render(TooltipHost, { props: { disabled: true } });

    await userEvent.hover(press());
    await waitNegativeClaim();

    expect(press()).not.toHaveAccessibleDescription();
  });

  it('should run the click given in its trigger props and close', async () => {
    const onclick = vi.fn();
    render(TooltipHost, { props: { onclick } });
    await userEvent.hover(press());
    await isShown();

    await userEvent.click(press());

    expect(onclick).toHaveBeenCalledOnce();
    await waitFor(() => expect(press()).not.toHaveAccessibleDescription());
  });

  it('should stay open on a press when asked to', async () => {
    render(TooltipHost, { props: { keepOpenOnPress: true } });
    await userEvent.hover(press());
    await isShown();

    await userEvent.click(press());
    await waitNegativeClaim();

    expect(press()).toHaveAccessibleDescription('Why it is');
  });

  it('should let the trigger props win over its own attributes', () => {
    render(TooltipHost, {
      props: { triggerProps: { id: 'own', 'aria-expanded': 'true' } },
    });

    expect(press()).toHaveAttribute('id', 'own');
    expect(press()).toHaveAttribute('aria-expanded', 'true');
  });

  describe('on a menu trigger', () => {
    it('should open its menu on a click', async () => {
      render(TooltipMenuHost);

      expect(menu()).not.toBeInTheDocument();

      await userEvent.click(rank());

      expect(await screen.findByRole('menu', { name: 'Sort by' }))
        .toBeVisible();
      expect(rank()).toHaveAttribute('aria-expanded', 'true');
    });

    it('should show its tooltip on a hover, with the menu shut', async () => {
      render(TooltipMenuHost);

      await userEvent.hover(rank());

      await waitFor(() =>
        expect(rank()).toHaveAccessibleDescription('Change the order')
      );
      expect(menu()).not.toBeInTheDocument();
    });

    it('should open its menu from the keyboard', async () => {
      render(TooltipMenuHost);
      await userEvent.tab();

      await userEvent.keyboard('{Enter}');

      expect(await screen.findByRole('menu', { name: 'Sort by' }))
        .toBeVisible();
    });
  });
});
