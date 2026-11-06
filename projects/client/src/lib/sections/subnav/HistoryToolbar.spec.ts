import { goto } from '$app/navigation';
import { useHistoryParams } from '$lib/features/history/stores/useHistoryParams.ts';
import { useDividers } from '$lib/stores/useDividers.ts';
import { HISTORY_PATH } from '$mocks/data/users/HISTORY_PATH.ts';
import { toolbarControls } from '$test/beds/lists/toolbarControls.ts';
import { openDialogByClick } from '$test/beds/menus/openDialogByClick.ts';
import { openMenuByClick } from '$test/beds/menus/openMenuByClick.ts';
import { pickMenuRadio } from '$test/beds/menus/pickMenuRadio.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { valueObservable } from '$test/beds/store/valueObservable.ts';
import { lastPush } from '$test/beds/url/lastPush.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { render, screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import HistoryToolbar from './HistoryToolbar.svelte';
import type { HistoryToolbarProps } from './_internal/HistoryToolbarProps.ts';

type ToolbarScreen =
  & Partial<Omit<HistoryToolbarProps, 'params'>>
  & { filters?: string; search?: string };

const { panelId: PANEL_ID } = toolbarControls();

async function renderToolbar(
  { filters = '', search = '', ...props }: ToolbarScreen = {},
) {
  const path = filters === '' ? HISTORY_PATH : `${HISTORY_PATH}/${filters}`;
  openAt(`${path}${search}`);
  const params = await renderStore(() =>
    useHistoryParams(valueObservable(filters))
  );

  return render(HistoryToolbar, {
    props: {
      params,
      dividers: useDividers(),
      controls: toolbarControls(),
      ...props,
    },
  });
}

const button = (name: string) => screen.getByRole('button', { name });
const stat = (label: string) => screen.getByTitle(label);

const rowsOf = (menu: HTMLElement) =>
  within(menu).getAllByRole('menuitemradio');

const labelsOf = (rows: ReadonlyArray<HTMLElement>) =>
  rows.map((row) => row.textContent?.trim());

beforeEach(() => {
  stubClientRects();
});

describe('section: HistoryToolbar', () => {
  describe('type menu', () => {
    it('should list All Types, Movies, Shows and Episodes, All checked', async () => {
      await renderToolbar();

      const rows = rowsOf(await openMenuByClick('Type: All Types', 'Type'));

      expect(labelsOf(rows))
        .toEqual(['All Types', 'Movies', 'Shows', 'Episodes']);
      expect(rows.at(0)).toHaveAttribute('aria-checked', 'true');
    });

    it('should show the type the path holds', async () => {
      await renderToolbar({ filters: 'episodes' });

      expect(button('Type: Episodes')).toHaveTextContent(/^Episodes$/);
    });

    it('should push a picked type, keeping the search but the page', async () => {
      await renderToolbar({ search: '?genres=drama&page=3' });
      await openMenuByClick('Type: All Types', 'Type');

      await pickMenuRadio('Movies');

      await waitFor(() =>
        expect(lastPush()).toBe(`${HISTORY_PATH}/movies?genres=drama`)
      );
    });

    it('should push the bare path on a pick of the All row', async () => {
      await renderToolbar({ filters: 'shows' });
      await openMenuByClick('Type: Shows', 'Type');

      await pickMenuRadio('All Types');

      await waitFor(() => expect(lastPush()).toBe(HISTORY_PATH));
    });

    it.each([
      { filters: '', trigger: 'Type: All Types', row: 'All Types' },
      { filters: 'movies', trigger: 'Type: Movies', row: 'Movies' },
    ])(
      'should write nothing on a pick of the checked $row row again',
      async ({ filters, trigger, row }) => {
        await renderToolbar({ filters });
        await openMenuByClick(trigger, 'Type');

        await pickMenuRadio(row);
        await waitNegativeClaim();

        expect(goto).not.toHaveBeenCalled();
      },
    );

    it('should sit in the start block', async () => {
      const { container } = await renderToolbar();

      expect(container.querySelector('.toolbar-start'))
        .toContainElement(button('Type: All Types'));
    });
  });

  describe('date range', () => {
    it('should follow the type menu in the start block', async () => {
      const { container } = await renderToolbar();

      expect(
        container.querySelector(
          '.toolbar-start > .trakt-dropdown-button + .trakt-date-range-button',
        ),
      ).toContainElement(button('Date Range'));
    });

    it('should turn accent while the URL holds a range', async () => {
      await renderToolbar({ search: '?start_at=2026-06-07' });

      const trigger = button('Date Range: Since 7 Jun 2026');

      expect(trigger).toHaveClass('is-selected');
      expect(trigger).toHaveAttribute('title', 'Since 7 Jun 2026');
    });

    it('should write through the params the screen hands it', async () => {
      await renderToolbar({ search: '?genres=drama&start_at=2026-06-07' });

      await openDialogByClick('Date Range: Since 7 Jun 2026', 'Date Range');
      await userEvent.click(button('Clear'));

      await waitFor(() =>
        expect(lastReplace()).toBe(`${HISTORY_PATH}?genres=drama`)
      );
    });
  });

  describe('stats', () => {
    it('should leave the item count blank while it loads', async () => {
      await renderToolbar();

      expect(stat('Items')).toHaveTextContent(/^Items$/);
    });

    it('should show the item count', async () => {
      await renderToolbar({ itemCount: 729 });

      expect(stat('Items')).toHaveTextContent(/^729 Items$/);
    });

    it('should show the plays, grouped', async () => {
      await renderToolbar({ plays: 1234 });

      expect(stat('Plays')).toHaveTextContent(/^1,234 Plays$/);
    });

    it('should use the singular for one play', async () => {
      await renderToolbar({ plays: 1 });

      expect(stat('Play')).toHaveTextContent(/^1 Play$/);
    });

    it('should leave the plays out while they are undefined', async () => {
      await renderToolbar({ itemCount: 729 });

      expect(screen.queryByTitle('Plays')).toBeNull();
    });

    it('should show zero plays', async () => {
      await renderToolbar({ plays: 0 });

      expect(stat('Plays')).toHaveTextContent(/^0 Plays$/);
    });

    it.each(['Items', 'Plays'])(
      'should mark the %s word wide',
      async (label) => {
        await renderToolbar({ itemCount: 729, plays: 730 });

        expect(stat(label)).toHaveAttribute('data-label', 'wide');
      },
    );
  });

  describe('sort', () => {
    it('should list Watched Date alone, checked', async () => {
      await renderToolbar();

      const rows = rowsOf(
        await openMenuByClick('Sort by: Watched Date', 'Sort by'),
      );

      expect(labelsOf(rows)).toEqual(['Watched Date']);
      expect(rows.at(0)).toHaveAttribute('aria-checked', 'true');
    });

    it('should write nothing on a pick of its one row', async () => {
      await renderToolbar();
      await openMenuByClick('Sort by: Watched Date', 'Sort by');

      await pickMenuRadio('Watched Date');
      await waitNegativeClaim();

      expect(goto).not.toHaveBeenCalled();
    });

    it('should sit in the options', async () => {
      const { container } = await renderToolbar();

      expect(container.querySelector(`#${PANEL_ID}`))
        .toContainElement(button('Sort by: Watched Date'));
    });
  });

  describe('dividers toggle', () => {
    // The options hide on phones; the toggle stays.
    it('should follow the options, outside them', async () => {
      const { container } = await renderToolbar();

      expect(
        container.querySelector('.toolbar-options + .trakt-dividers-toggle'),
      )
        .toContainElement(button('Toggle Dividers'));
      expect(container.querySelector(`#${PANEL_ID}`))
        .not.toContainElement(button('Toggle Dividers'));
    });

    it('should flip the instance the screen hands it', async () => {
      const dividers = useDividers();
      await renderToolbar({ dividers });

      await userEvent.click(button('Toggle Dividers'));

      expect(await readKnown(dividers.shown)).toBe(false);
    });
  });

  describe('the frame', () => {
    it('should keep the controls on phones', async () => {
      const { container } = await renderToolbar();

      expect(container.querySelector('.trakt-subnav-toolbar'))
        .toHaveAttribute('data-phone', 'controls');
    });

    it('should hold only the two menus, the date range and the dividers toggle, with no gear', async () => {
      await renderToolbar({
        controls: toolbarControls({ untitled: {}, open: true }),
      });

      expect(
        screen.getAllByRole('button')
          .map((found) => found.getAttribute('aria-label')),
      ).toEqual([
        'Type: All Types',
        'Date Range',
        'Sort by: Watched Date',
        'Toggle Dividers',
      ]);
    });

    it('should never open the options on phones', async () => {
      const { container } = await renderToolbar({
        controls: toolbarControls({ untitled: {}, open: true }),
      });

      expect(container.querySelector(`#${PANEL_ID}`))
        .not.toHaveClass('is-open');
    });
  });
});
