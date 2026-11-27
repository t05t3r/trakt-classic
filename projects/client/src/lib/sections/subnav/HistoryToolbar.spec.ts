import { isGearDotted } from '$test/beds/subnav/isGearDotted.ts';
import { isTriggerChanged } from '$test/beds/subnav/isTriggerChanged.ts';
import { countStat } from '$test/beds/stats/countStat.ts';
import { queryCountStat } from '$test/beds/stats/queryCountStat.ts';
import { goto } from '$app/navigation';
import { useHistoryParams } from '$lib/features/history/stores/useHistoryParams.ts';
import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { useDividers } from '$lib/stores/useDividers.ts';
import { HISTORY_PATH } from '$mocks/data/users/HISTORY_PATH.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { ariaLabelsOf } from '$test/beds/dom/ariaLabelsOf.ts';
import { controlledBy } from '$test/beds/dom/controlledBy.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { toolbarControls } from '$test/beds/lists/toolbarControls.ts';
import { openDialogByClick } from '$test/beds/menus/openDialogByClick.ts';
import { openMenuByClick } from '$test/beds/menus/openMenuByClick.ts';
import { pickMenuRadio } from '$test/beds/menus/pickMenuRadio.ts';
import { readCheckedMenuRow } from '$test/beds/menus/readCheckedMenuRow.ts';
import { readMenuRows } from '$test/beds/menus/readMenuRows.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { valueObservable } from '$test/beds/store/valueObservable.ts';
import { lastPush } from '$test/beds/url/lastPush.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HistoryToolbar from './HistoryToolbar.svelte';
import type { HistoryToolbarProps } from './_internal/HistoryToolbarProps.ts';

const setLayout = fakeLayouts({
  desktop: WELL_KNOWN_MEDIA_QUERY.desktop,
  mobile: WELL_KNOWN_MEDIA_QUERY.mobile,
});

type ToolbarScreen =
  & Partial<Omit<HistoryToolbarProps, 'params'>>
  & { filters?: string; search?: string };

async function renderToolbar(
  { filters = '', search = '', ...props }: ToolbarScreen = {},
) {
  const path = filters === '' ? HISTORY_PATH : `${HISTORY_PATH}/${filters}`;
  openAt(`${path}${search}`);
  const params = await renderStore(() =>
    useHistoryParams(valueObservable(filters))
  );

  const rendered = renderComponent(HistoryToolbar, {
    props: {
      params,
      dividers: useDividers(),
      controls: toolbarControls(),
      ...props,
    },
  });
  await rendered.userLoaded;

  return rendered;
}

const button = (name: string) => screen.getByRole('button', { name });

beforeEach(() => {
  stubClientRects();
  setLayout('desktop');
});

describe('section: HistoryToolbar', () => {
  describe('type menu', () => {
    it('should list All Types, Movies, Shows and Episodes, All checked', async () => {
      await renderToolbar();

      await openMenuByClick('Type: All Types', 'Type');

      expect(readMenuRows('menuitemradio'))
        .toEqual(['All Types', 'Movies', 'Shows', 'Episodes']);
      expect(readCheckedMenuRow()).toBe('All Types');
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

    it('should close the panel on a pick that changes the type', async () => {
      const close = vi.fn();
      await renderToolbar({ controls: toolbarControls({ close }) });
      await openMenuByClick('Type: All Types', 'Type');

      await pickMenuRadio('Movies');

      expect(close).toHaveBeenCalledOnce();
    });

    it('should clear the item and close the panel on a pick of the checked row', async () => {
      const close = vi.fn();
      await renderToolbar({
        filters: 'episodes',
        search: '?show=12',
        controls: toolbarControls({ close }),
      });
      await openMenuByClick('Type: Episodes', 'Type');

      await pickMenuRadio('Episodes');

      await waitFor(() => expect(lastPush()).toBe(`${HISTORY_PATH}/episodes`));
      expect(close).toHaveBeenCalledOnce();
    });

    it('should write nothing and close the panel on a pick of the checked row with no item', async () => {
      const close = vi.fn();
      await renderToolbar({
        filters: 'episodes',
        controls: toolbarControls({ close }),
      });
      await openMenuByClick('Type: Episodes', 'Type');

      await pickMenuRadio('Episodes');
      await waitNegativeClaim();

      expect(goto).not.toHaveBeenCalled();
      expect(close).toHaveBeenCalledOnce();
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

      const start = assertDefined(
        container.querySelector<HTMLElement>('.toolbar-start'),
      );
      expect(ariaLabelsOf(within(start).getAllByRole('button')))
        .toEqual(['Type: All Types', 'Date Range']);
    });

    it('should sit between the gear and the dividers toggle on phones, out of the panel', async () => {
      setLayout('mobile');
      await renderToolbar();

      const panel = assertDefined(controlledBy(button('Options')));
      expect(ariaLabelsOf(within(panel).getAllByRole('button')))
        .toEqual(['Type: All Types']);
      expect(ariaLabelsOf(screen.getAllByRole('button'))).toEqual([
        'Options',
        'Type: All Types',
        'Date Range',
        'Toggle Dividers',
      ]);
    });

    it('should turn accent while the URL holds a range', async () => {
      await renderToolbar({ search: '?start_at=2026-06-07' });

      const trigger = button('Date Range: Since 7 Jun 2026');

      expect(trigger).toHaveClass('is-selected');
      await userEvent.hover(trigger);
      await waitFor(() =>
        expect(trigger).toHaveAccessibleDescription('Since 7 Jun 2026')
      );
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

      expect(countStat('Items')).toHaveTextContent(/^Items$/);
    });

    it('should show the item count', async () => {
      await renderToolbar({ itemCount: 729 });

      expect(countStat('Items')).toHaveTextContent(/^729 Items$/);
    });

    it('should show the plays, grouped', async () => {
      await renderToolbar({ plays: 1234 });

      expect(countStat('Plays')).toHaveTextContent(/^1,234 Plays$/);
    });

    it('should use the singular for one play', async () => {
      await renderToolbar({ plays: 1 });

      expect(countStat('Play')).toHaveTextContent(/^1 Play$/);
    });

    it('should leave the plays out while they are undefined', async () => {
      await renderToolbar({ itemCount: 729 });

      expect(queryCountStat('Plays')).toBeNull();
    });

    it('should show zero plays', async () => {
      await renderToolbar({ plays: 0 });

      expect(countStat('Plays')).toHaveTextContent(/^0 Plays$/);
    });

    it.each(['Items', 'Plays'])(
      'should mark the %s word wide',
      async (label) => {
        await renderToolbar({ itemCount: 729, plays: 730 });

        expect(countStat(label)).toHaveAttribute('data-label', 'wide');
      },
    );
  });

  describe('dividers toggle', () => {
    it('should flip the instance the screen hands it', async () => {
      const dividers = useDividers();
      await renderToolbar({ dividers });

      await userEvent.click(button('Toggle Dividers'));

      expect(await readKnown(dividers.shown)).toBe(false);
    });
  });

  describe('the frame', () => {
    it('should hold the gear, the type menu, the date range and the dividers toggle, in that order', async () => {
      await renderToolbar();

      expect(ariaLabelsOf(screen.getAllByRole('button'))).toEqual([
        'Options',
        'Type: All Types',
        'Date Range',
        'Toggle Dividers',
      ]);
    });

    it('should open the panel that holds the type menu from the phone gear', async () => {
      setLayout('mobile');
      const toggle = vi.fn();
      await renderToolbar({ controls: toolbarControls({ toggle }) });

      const panel = assertDefined(controlledBy(button('Options')));
      await userEvent.click(button('Options'));

      expect(ariaLabelsOf(within(panel).getAllByRole('button')))
        .toEqual(['Type: All Types']);
      expect(panel).not.toContainElement(button('Toggle Dividers'));
      expect(toggle).toHaveBeenCalledOnce();
    });
  });

  describe('off the default', () => {
    it('should draw no trigger in the accent and dot no gear at the defaults', async () => {
      await renderToolbar();

      expect([isTriggerChanged('Type: All Types'), isGearDotted()])
        .toEqual([false, false]);
    });

    it('should accent the type and dot the gear', async () => {
      await renderToolbar({ filters: 'episodes' });

      expect([isTriggerChanged('Type: Episodes'), isGearDotted()])
        .toEqual([true, true]);
    });

    it('should dot no gear for a range, whose button stays in the row', async () => {
      setLayout('mobile');
      await renderToolbar({ search: '?start_at=2026-06-07' });

      expect([isTriggerChanged('Date Range: Since 7 Jun 2026'), isGearDotted()])
        .toEqual([true, false]);
    });
  });
});
