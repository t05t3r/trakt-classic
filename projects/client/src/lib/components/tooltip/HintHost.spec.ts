import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { emulateFocusVisible } from '$test/beds/focus/emulateFocusVisible.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import PopoverHost from '$test/beds/menus/PopoverHost.svelte';
import HintsHost from '$test/beds/tooltip/HintsHost.svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { type ComponentProps, createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const DELAY = 150;

const poster = () => screen.getByRole('link', { name: 'Poster' });
const box = () => screen.getByRole('group', { name: 'Box' });
const inside = () => screen.getByRole('link', { name: 'Inside' });
const badge = () => screen.getByRole('img', { name: 'Badge' });
const rank = () => screen.getByRole('button', { name: 'Rank' });
const menu = () => screen.queryByRole('menu', { name: 'Sort by' });
const tooltip = () =>
  assertDefined(document.querySelector('.trakt-tooltip'), 'No tooltip open');

const pass = (ms: number) => vi.advanceTimersByTimeAsync(ms);

function setup(props: ComponentProps<typeof HintsHost> = {}) {
  const user = userEvent.setup({
    advanceTimers: (ms) => vi.advanceTimersByTime(ms),
  });
  const { rerender } = render(HintsHost, { props });

  const hover = async (element: Element) => {
    await user.hover(element);
    await pass(DELAY);
  };

  // jsdom lays nothing out, so every box is the one point a plain move ends on.
  const leave = async () => {
    await user.pointer({ target: document.body, coords: { x: 900, y: 900 } });
    // bits-ui waits a little for a pointer on its way to the tooltip.
    await pass(DELAY * 2);
  };

  return { user, rerender, hover, leave };
}

describe('component: HintHost', () => {
  beforeEach(() => {
    stubClientRects();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('look', () => {
    it('should show the hint and its detail lines', async () => {
      const { hover } = setup({
        poster: { content: 'The poster', detail: 'Season 1\nWatched' },
      });

      await hover(poster());

      expect(
        [...tooltip().querySelectorAll('p')].map((line) => [
          line.textContent,
          line.classList.contains('trakt-tooltip-detail'),
        ]),
      ).toEqual([['The poster', false], ['Season 1\nWatched', true]]);
    });

    it('should point an arrow from its top side at the element', async () => {
      const { hover } = setup();

      await hover(poster());

      expect(tooltip().querySelector('.tooltip-arrow')).toHaveAttribute(
        'data-side',
        'top',
      );
    });

    it('should open below the element when asked to', async () => {
      const { hover } = setup({
        poster: { content: 'The poster', side: 'bottom' },
      });

      await hover(poster());

      expect(tooltip().querySelector('.tooltip-arrow')).toHaveAttribute(
        'data-side',
        'bottom',
      );
    });

    it('should render a snippet', async () => {
      const content = createRawSnippet(() => ({
        render: () => '<p>The <b>bold</b> poster</p>',
      }));
      const { hover } = setup({ poster: { content } });

      await hover(poster());

      expect(tooltip().querySelector('b')).toHaveTextContent('bold');
      expect(poster()).toHaveAccessibleDescription('The bold poster');
    });

    it('should follow a hint that changes while it is open', async () => {
      const { hover, rerender } = setup();
      await hover(poster());

      await rerender({ poster: { content: 'Another poster' } });
      await pass(0);

      expect(poster()).toHaveAccessibleDescription('Another poster');
    });
  });

  describe('hover', () => {
    it('should open once the pointer has rested on the element, naming it as described only then', async () => {
      const { user } = setup();

      expect(poster()).not.toHaveAttribute('aria-describedby');

      await user.hover(poster());
      await pass(DELAY - 1);
      expect(poster()).not.toHaveAttribute('aria-describedby');

      await pass(1);
      expect(poster()).toHaveAccessibleDescription('The poster');
    });

    it('should count the delay from the entry, not from the last child crossed', async () => {
      setup();

      await fireEvent.pointerOver(poster());
      await pass(DELAY - 1);
      const image = screen.getByText('Image');
      await fireEvent.pointerOut(poster(), { relatedTarget: image });
      await fireEvent.pointerOver(image);
      await pass(1);

      expect(poster()).toHaveAccessibleDescription('The poster');
    });

    it('should stay shut when the pointer leaves within the delay', async () => {
      const { user } = setup();

      await user.hover(poster());
      await pass(DELAY - 1);
      await user.hover(document.body);
      await pass(DELAY);

      expect(poster()).not.toHaveAttribute('aria-describedby');
    });

    it('should stay shut when the pointer leaves the window within the delay', async () => {
      setup();

      await fireEvent.pointerOver(poster());
      await fireEvent.pointerOut(poster(), { relatedTarget: null });
      await pass(DELAY);

      expect(poster()).not.toHaveAttribute('aria-describedby');
    });

    it('should close once the pointer has left, leaving no description', async () => {
      const { hover, leave } = setup();
      await hover(poster());

      await leave();

      expect(poster()).not.toHaveAttribute('aria-describedby');
      expect(document.querySelector('.trakt-tooltip')).toBeNull();
    });

    it("should move to the next element after that element's delay", async () => {
      const { hover } = setup();
      await hover(poster());

      await hover(box());

      expect(box()).toHaveAccessibleDescription('The box');
      expect(poster()).not.toHaveAttribute('aria-describedby');
      expect(document.querySelectorAll('.trakt-tooltip')).toHaveLength(1);
    });

    it('should open over a link inside the element', async () => {
      const { hover } = setup();

      await hover(inside());

      expect(box()).toHaveAccessibleDescription('The box');
    });

    it('should stay open while the pointer is on the tooltip, crossing another element on its way', async () => {
      const { user, hover } = setup();
      await hover(poster());

      await fireEvent.pointerLeave(poster(), { relatedTarget: box() });
      await fireEvent.pointerOver(box());
      await user.hover(tooltip());
      await pass(DELAY * 2);

      expect(poster()).toHaveAccessibleDescription('The poster');
    });

    it('should close once the pointer has left the tooltip too', async () => {
      const { user, hover, leave } = setup();
      await hover(poster());
      await user.hover(tooltip());

      await leave();

      expect(poster()).not.toHaveAttribute('aria-describedby');
    });

    it('should close at once when the pointer leaves an element whose tooltip lets it through', async () => {
      const { user, hover } = setup({
        poster: { content: 'The poster', isPassThrough: true },
      });
      await hover(poster());

      await user.hover(box());
      await pass(0);

      expect(poster()).not.toHaveAttribute('aria-describedby');
    });

    it('should stay shut while its element has no hint', async () => {
      const { hover } = setup({ poster: null });

      await hover(poster());

      expect(poster()).not.toHaveAttribute('aria-describedby');
    });

    it('should close when its element loses its hint', async () => {
      const { hover, rerender } = setup();
      await hover(poster());

      await rerender({ poster: null });
      await pass(0);

      expect(poster()).not.toHaveAttribute('aria-describedby');
      expect(document.querySelector('.trakt-tooltip')).toBeNull();
    });

    it('should stay shut when the hint returns after the pointer has left', async () => {
      const { hover, leave, rerender } = setup();
      await hover(poster());
      await rerender({ poster: null });
      await pass(0);

      await leave();
      await rerender({ poster: { content: 'The poster' } });
      await pass(DELAY * 2);

      expect(poster()).not.toHaveAttribute('aria-describedby');
    });

    it("should leave the element's own description in its place", async () => {
      const { hover, rerender } = setup();
      await hover(poster());

      await rerender({ poster: null, described: 'own' });
      await pass(0);

      expect(poster()).toHaveAttribute('aria-describedby', 'own');
    });

    it('should stay shut on a touch', async () => {
      setup();

      await fireEvent.pointerOver(poster(), { pointerType: 'touch' });
      await pass(DELAY);

      expect(poster()).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('keyboard', () => {
    it('should open at once on the focus of the element itself', async () => {
      const { user } = setup();

      await user.tab();
      await pass(0);

      expect(poster()).toHaveFocus();
      expect(poster()).toHaveAccessibleDescription('The poster');
    });

    it('should close on the blur, and stay shut on the focus of a link inside an element', async () => {
      const { user } = setup();
      await user.tab();

      await user.tab();
      await pass(DELAY);

      expect(inside()).toHaveFocus();
      expect(poster()).not.toHaveAttribute('aria-describedby');
      expect(box()).not.toHaveAttribute('aria-describedby');
    });

    it("should stay shut on a focus that is not the keyboard's", async () => {
      emulateFocusVisible();
      setup();

      poster().focus();
      await pass(DELAY);

      expect(poster()).toHaveFocus();
      expect(poster()).not.toHaveAttribute('aria-describedby');
    });

    it('should close on Escape and open again on a later hover', async () => {
      const { user, hover, leave } = setup();
      await hover(poster());

      await user.keyboard('{Escape}');
      await pass(DELAY);
      expect(poster()).not.toHaveAttribute('aria-describedby');

      await leave();
      await hover(poster());
      expect(poster()).toHaveAccessibleDescription('The poster');
    });

    it('should stay open through the scroll the focus makes, and close on a later one', async () => {
      const { user } = setup();
      await user.tab();

      await fireEvent.scroll(document);
      await pass(0);
      expect(poster()).toHaveAccessibleDescription('The poster');

      await pass(DELAY);
      await fireEvent.scroll(document);
      await pass(0);
      expect(poster()).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('close', () => {
    it.each(['mouse', 'touch'])('should close on a %s press', async (type) => {
      const { hover } = setup();
      await hover(poster());

      await fireEvent.pointerDown(screen.getByText('Image'), {
        pointerType: type,
      });
      await pass(0);

      expect(poster()).not.toHaveAttribute('aria-describedby');
    });

    it('should cancel a pending open on a press', async () => {
      const { user } = setup();
      await user.hover(poster());

      await fireEvent.pointerDown(poster());
      await pass(DELAY);

      expect(poster()).not.toHaveAttribute('aria-describedby');
    });

    it('should stay open on a press when asked to', async () => {
      const onclick = vi.fn((event: MouseEvent) => event.preventDefault());
      const { user, hover } = setup({
        poster: { content: 'The poster', keepOpenOnPress: true },
        onclick,
      });
      await hover(poster());

      await user.click(poster());
      await pass(DELAY);

      expect(onclick).toHaveBeenCalledOnce();
      expect(poster()).toHaveAccessibleDescription('The poster');
    });

    it('should leave a press on its element to close the popover it is over', async () => {
      const { hover } = setup();
      render(PopoverHost);
      fireEvent.click(screen.getByRole('button', { name: 'Rate' }));
      await pass(DELAY);
      const dialog = () => screen.queryByRole('dialog');
      expect(dialog()).toBeInTheDocument();
      await hover(poster());

      fireEvent.pointerDown(poster(), { clientX: 1, clientY: 1 });
      await pass(DELAY);

      expect(dialog()).not.toBeInTheDocument();
      expect(poster()).not.toHaveAttribute('aria-describedby');
    });

    it('should close on a click from the keyboard', async () => {
      const { user } = setup();
      await user.tab();

      await user.keyboard('{Enter}');
      await pass(0);

      expect(poster()).not.toHaveAttribute('aria-describedby');
    });

    it('should stay open on a press on the tooltip', async () => {
      const { user, hover } = setup();
      await hover(poster());

      await user.pointer({ target: tooltip(), keys: '[MouseLeft]' });
      await pass(DELAY);

      expect(poster()).toHaveAccessibleDescription('The poster');
    });

    it('should close on a scroll of the page', async () => {
      const { hover } = setup();
      await hover(poster());

      await fireEvent.scroll(document);
      await pass(0);

      expect(poster()).not.toHaveAttribute('aria-describedby');
    });

    it('should close when its element leaves the page', async () => {
      const { hover, rerender } = setup();
      await hover(poster());

      await rerender({ isShown: false });
      await pass(0);

      expect(document.querySelector('.trakt-tooltip')).toBeNull();
    });

    it('should stay shut when its element leaves the page within the delay', async () => {
      const { user, rerender } = setup();
      await user.hover(poster());

      await rerender({ isShown: false });
      await pass(DELAY);

      expect(document.querySelector('.trakt-tooltip')).toBeNull();
    });
  });

  describe('around an element with a hint', () => {
    it("should leave the inner element's hover to its own hint", async () => {
      const { hover } = setup();

      await hover(badge());

      expect(badge()).toHaveAccessibleDescription('The badge');
      expect(poster()).not.toHaveAttribute('aria-describedby');
    });

    it('should close on the way to the inner element and come back with the pointer', async () => {
      const { user, hover } = setup();
      await hover(poster());

      await user.hover(badge());
      await pass(0);
      expect(poster()).not.toHaveAttribute('aria-describedby');
      await pass(DELAY);
      expect(badge()).toHaveAccessibleDescription('The badge');

      await hover(poster());
      expect(poster()).toHaveAccessibleDescription('The poster');
    });
  });

  describe('on a menu trigger', () => {
    it('should show the hint on a hover, with the menu shut', async () => {
      const { hover } = setup();

      await hover(rank());

      expect(rank()).toHaveAccessibleDescription('Change the order');
      expect(menu()).not.toBeInTheDocument();
    });

    it('should leave the click to the menu and close', async () => {
      const { user, hover } = setup();
      await hover(rank());

      await user.click(rank());
      await pass(0);

      expect(menu()).toBeVisible();
      expect(rank()).not.toHaveAttribute('aria-describedby');
    });

    it('should leave the keyboard to the menu', async () => {
      const { user } = setup();
      await user.tab();
      await user.tab();
      await user.tab();
      expect(rank()).toHaveAccessibleDescription('Change the order');

      await user.keyboard('{Enter}');
      await pass(0);

      expect(menu()).toBeVisible();
    });
  });
});
