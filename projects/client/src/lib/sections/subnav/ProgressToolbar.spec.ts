import { isGearDotted } from '$test/beds/subnav/isGearDotted.ts';
import { isTriggerChanged } from '$test/beds/subnav/isTriggerChanged.ts';
import { countStat } from '$test/beds/stats/countStat.ts';
import { goto } from '$app/navigation';
import { PROGRESS_SORTS } from '$lib/features/progress/PROGRESS_SORTS.ts';
import { useProgressParams } from '$lib/features/progress/stores/useProgressParams.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { PROGRESS_PATH } from '$mocks/data/users/PROGRESS_PATH.ts';
import { ariaLabelsOf } from '$test/beds/dom/ariaLabelsOf.ts';
import { controlledBy } from '$test/beds/dom/controlledBy.ts';
import { toolbarControls } from '$test/beds/lists/toolbarControls.ts';
import { openMenuByClick } from '$test/beds/menus/openMenuByClick.ts';
import { pickMenuRadio } from '$test/beds/menus/pickMenuRadio.ts';
import { readCheckedMenuRow } from '$test/beds/menus/readCheckedMenuRow.ts';
import { readMenuRows } from '$test/beds/menus/readMenuRows.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { valueObservable } from '$test/beds/store/valueObservable.ts';
import { expectOneReplace } from '$test/beds/url/expectOneReplace.ts';
import { lastPush } from '$test/beds/url/lastPush.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { render, screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProgressToolbar from './ProgressToolbar.svelte';
import type { ProgressToolbarProps } from './_internal/ProgressToolbarProps.ts';

const { panelId: PANEL_ID } = toolbarControls();

type ToolbarScreen =
  & Partial<Omit<ProgressToolbarProps, 'params'>>
  & { filters?: string; search?: string };

async function renderToolbar(
  { filters = '', search = '', ...props }: ToolbarScreen = {},
) {
  const path = filters === '' ? PROGRESS_PATH : `${PROGRESS_PATH}/${filters}`;
  openAt(`${path}${search}`);
  const params = await renderStore(() =>
    useProgressParams(valueObservable(filters))
  );

  return render(ProgressToolbar, {
    props: { params, controls: toolbarControls(), ...props },
  });
}

const button = (name: string) => screen.getByRole('button', { name });

beforeEach(() => {
  stubClientRects();
});

describe('section: ProgressToolbar', () => {
  describe('view switcher', () => {
    it.each([
      { filters: '', view: 'Watched' },
      { filters: 'dropped', view: 'Dropped' },
    ])(
      'should read $view on the $view view, its row checked of the two',
      async ({ filters, view }) => {
        await renderToolbar({ filters });

        expect(button(`View: ${view}`)).toHaveTextContent(
          new RegExp(`^${view}$`),
        );
        await openMenuByClick(`View: ${view}`, 'View');

        expect(readMenuRows('menuitemradio')).toEqual(['Watched', 'Dropped']);
        expect(readCheckedMenuRow()).toBe(view);
      },
    );

    it.each([
      { filters: '', from: 'Watched', to: 'Dropped', path: 'dropped' },
      { filters: 'dropped', from: 'Dropped', to: 'Watched', path: '' },
    ])(
      'should push the $to view on a pick, keeping the search but the page',
      async ({ filters, from, to, path }) => {
        await renderToolbar({ filters, search: '?fade=watched&page=2' });
        await openMenuByClick(`View: ${from}`, 'View');

        await pickMenuRadio(to);

        const pushed = path === '' ? PROGRESS_PATH : `${PROGRESS_PATH}/${path}`;
        await waitFor(() => expect(lastPush()).toBe(`${pushed}?fade=watched`));
      },
    );

    it('should sit in the start block, closing the panel on a pick', async () => {
      const close = vi.fn();
      const { container } = await renderToolbar({
        controls: toolbarControls({ close }),
      });
      const start = assertDefined(container.querySelector<HTMLElement>(
        '.toolbar-start',
      ));
      expect(ariaLabelsOf(within(start).getAllByRole('button')))
        .toEqual(['View: Watched']);
      await openMenuByClick('View: Watched', 'View');

      await pickMenuRadio('Dropped');
      await waitFor(() => expect(lastPush()).toBe(`${PROGRESS_PATH}/dropped`));

      expect(close).toHaveBeenCalledOnce();
    });
  });

  describe('sort', () => {
    it.each([
      { filters: '', view: 'watched' as const },
      { filters: 'dropped', view: 'dropped' as const },
    ])(
      "should list the $view view's own sorts, its default checked",
      async ({ filters, view }) => {
        await renderToolbar({ filters });

        await openMenuByClick('Sort by: Watched Date', 'Sort by');

        expect(readMenuRows('menuitemradio'))
          .toEqual(PROGRESS_SORTS[view].map(({ label }) => label()));
        expect(readCheckedMenuRow()).toBe('Watched Date');
      },
    );

    it('should push a picked sort at its default direction, keeping the search but the page', async () => {
      await renderToolbar({ search: '?fade=watched&page=3' });
      await openMenuByClick('Sort by: Watched Date', 'Sort by');

      await pickMenuRadio('Title');

      await waitFor(() =>
        expect(lastPush())
          .toBe(`${PROGRESS_PATH}/watched/title/asc?fade=watched`)
      );
    });

    it.each([
      { filters: '', pressed: false },
      { filters: 'watched/title/desc', pressed: true },
      { filters: 'dropped/hidden/asc', pressed: false },
    ])(
      'should press the direction $pressed at $filters',
      async ({ filters, pressed }) => {
        await renderToolbar({ filters });

        expect(button('Direction'))
          .toHaveAttribute('aria-pressed', String(pressed));
      },
    );

    it('should push the reversed sort on a press of the direction', async () => {
      await renderToolbar({ filters: 'dropped/hidden/asc' });

      await userEvent.click(button('Direction'));

      await waitFor(() =>
        expect(lastPush()).toBe(`${PROGRESS_PATH}/dropped/hidden/desc`)
      );
    });

    it('should close the panel on a pick and on a press of the direction', async () => {
      const close = vi.fn();
      await renderToolbar({ controls: toolbarControls({ close }) });
      await openMenuByClick('Sort by: Watched Date', 'Sort by');

      await pickMenuRadio('Title');
      await userEvent.click(button('Direction'));

      expect(close).toHaveBeenCalledTimes(2);
    });

    it.each([
      { trigger: 'View: Watched', menu: 'View', pick: 'Watched' },
      {
        trigger: 'Sort by: Watched Date',
        menu: 'Sort by',
        pick: 'Watched Date',
      },
    ])(
      'should write nothing and close the panel on a pick of the checked $menu row',
      async ({ trigger, menu, pick }) => {
        const close = vi.fn();
        await renderToolbar({ controls: toolbarControls({ close }) });
        await openMenuByClick(trigger, menu);

        await pickMenuRadio(pick);
        await waitNegativeClaim();

        expect(goto).not.toHaveBeenCalled();
        expect(close).toHaveBeenCalledOnce();
      },
    );

    it('should hold the sort menu and the direction alone in the options', async () => {
      const { container } = await renderToolbar();

      const options = assertDefined(container.querySelector<HTMLElement>(
        '.toolbar-options',
      ));

      expect(ariaLabelsOf(within(options).getAllByRole('button')))
        .toEqual(['Sort by: Watched Date', 'Direction']);
    });
  });

  describe('eye', () => {
    it('should show the filter the URL holds', async () => {
      await renderToolbar({ search: '?hide_completed=true' });

      await openMenuByClick('Filters', 'Filters');

      expect(readCheckedMenuRow()).toBe('Hide watched');
    });

    it('should replace the URL on a pick, leaving the panel alone outside it', async () => {
      const close = vi.fn();
      const { container } = await renderToolbar({
        search: '?page=2',
        controls: toolbarControls({ close }),
      });
      expect(container.querySelector(`#${PANEL_ID}`))
        .not.toContainElement(button('Filters'));
      await openMenuByClick('Filters', 'Filters');

      await pickMenuRadio('Fade watched');

      await waitFor(() => expectOneReplace());
      expect(lastReplace()).toBe(`${PROGRESS_PATH}?page=2&fade=watched`);
      await waitNegativeClaim();
      expect(close).not.toHaveBeenCalled();
    });
  });

  describe('stats', () => {
    it('should leave every stat blank while the stats load', async () => {
      await renderToolbar();

      expect(countStat('Watched')).toHaveTextContent(/^Watched$/);
      expect(countStat('Time left to watch'))
        .toHaveTextContent(/^Time left to watch$/);
      expect(countStat('shows')).toHaveTextContent(/^shows$/);
      expect(countStat('shows')).not.toHaveAttribute('data-label');
    });

    it.each([
      {
        completed: 1234,
        aired: 4567,
        text: /^27% Watched 1,234 \/ 4,567 episodes$/,
      },
      { completed: 545, aired: 783, text: /^69% Watched 545 \/ 783 episodes$/ },
    ])(
      'should show the floored watched share over its under-count at $completed of $aired',
      async ({ completed, aired, text }) => {
        await renderToolbar({
          stats: { completed, aired, minutesLeft: 0, shows: 9 },
        });

        expect(countStat('Watched')).toHaveTextContent(text);
      },
    );

    it('should show a share of 0% while no episode has aired', async () => {
      await renderToolbar({
        stats: { completed: 0, aired: 0, minutesLeft: 0, shows: 0 },
      });

      expect(countStat('Watched'))
        .toHaveTextContent(/^0% Watched 0 \/ 0 episodes$/);
    });

    it('should show the time left over the episodes left', async () => {
      await renderToolbar({
        stats: { completed: 545, aired: 783, minutesLeft: 11104, shows: 55 },
      });

      expect(countStat('Time left to watch'))
        .toHaveTextContent(/^7d 17h 4m Time left to watch 238 episodes$/);
    });

    it('should show the shows count, with its word wide', async () => {
      await renderToolbar({
        stats: { completed: 545, aired: 783, minutesLeft: 11104, shows: 55 },
      });

      expect(countStat('shows')).toHaveTextContent(/^55 shows$/);
      expect(countStat('shows')).toHaveAttribute('data-label', 'wide');
    });
  });

  describe('the frame', () => {
    it('should hold the controls in order, the gear before the panel and the eye after it', async () => {
      await renderToolbar();

      expect(ariaLabelsOf(screen.getAllByRole('button'))).toEqual([
        'Options',
        'View: Watched',
        'Sort by: Watched Date',
        'Direction',
        'Filters',
      ]);
    });

    it('should open the panel that holds the view and the sort from the phone gear', async () => {
      const toggle = vi.fn();
      await renderToolbar({ controls: toolbarControls({ toggle }) });

      const panel = assertDefined(controlledBy(button('Options')));
      await userEvent.click(button('Options'));

      expect(ariaLabelsOf(within(panel).getAllByRole('button')))
        .toEqual(['View: Watched', 'Sort by: Watched Date', 'Direction']);
      expect(toggle).toHaveBeenCalledOnce();
    });

    it('should keep the stats and the eye in the row, outside the panel', async () => {
      const { container } = await renderToolbar();

      const panel = assertDefined(controlledBy(button('Options')));
      expect(panel).not.toContainElement(button('Filters'));
      expect(panel).not.toContainElement(
        container.querySelector('.trakt-count-stat'),
      );
    });
  });

  describe('off the default', () => {
    it('should draw no trigger in the accent and dot no gear at the defaults', async () => {
      await renderToolbar();

      expect([
        isTriggerChanged('View: Watched'),
        isTriggerChanged('Sort by: Watched Date'),
        isGearDotted(),
      ]).toEqual([false, false, false]);
    });

    it.each([
      ['the dropped view', 'dropped', 'View: Dropped'],
      ['another sort', 'watched/title/asc', 'Sort by: Title'],
      [
        'the default sort reversed',
        'watched/added/desc',
        'Sort by: Watched Date',
      ],
    ])('should accent the control under %s and dot the gear', async (
      _,
      filters,
      name,
    ) => {
      await renderToolbar({ filters });

      expect([isTriggerChanged(name), isGearDotted()]).toEqual([true, true]);
    });

    it("should hold the dropped view's default sort as no change of the sort", async () => {
      await renderToolbar({ filters: 'dropped' });

      expect(isTriggerChanged('Sort by: Watched Date')).toBe(false);
    });
  });
});
