import { isGearDotted } from '$test/beds/subnav/isGearDotted.ts';
import { isTriggerChanged } from '$test/beds/subnav/isTriggerChanged.ts';
import { countStat } from '$test/beds/stats/countStat.ts';
import { goto } from '$app/navigation';
import { useRatingsParams } from '$lib/features/ratings/stores/useRatingsParams.ts';
import { useDividers } from '$lib/stores/useDividers.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { RATINGS_PATH } from '$mocks/data/users/RATINGS_PATH.ts';
import { ariaLabelsOf } from '$test/beds/dom/ariaLabelsOf.ts';
import { controlledBy } from '$test/beds/dom/controlledBy.ts';
import { toolbarControls } from '$test/beds/lists/toolbarControls.ts';
import { openMenuByClick } from '$test/beds/menus/openMenuByClick.ts';
import { pickMenuRadio } from '$test/beds/menus/pickMenuRadio.ts';
import { readCheckedMenuRow } from '$test/beds/menus/readCheckedMenuRow.ts';
import { readMenuRows } from '$test/beds/menus/readMenuRows.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { valueObservable } from '$test/beds/store/valueObservable.ts';
import { expectOneReplace } from '$test/beds/url/expectOneReplace.ts';
import { lastPush } from '$test/beds/url/lastPush.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { render, screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RatingsToolbar from './RatingsToolbar.svelte';
import type { RatingsToolbarProps } from './_internal/RatingsToolbarProps.ts';

type ToolbarScreen =
  & Partial<Omit<RatingsToolbarProps, 'params'>>
  & { filters?: string; search?: string };

const { panelId: PANEL_ID } = toolbarControls();

async function renderToolbar(
  { filters = '', search = '', ...props }: ToolbarScreen = {},
) {
  const path = filters === '' ? RATINGS_PATH : `${RATINGS_PATH}/${filters}`;
  openAt(`${path}${search}`);
  const params = await renderStore(() =>
    useRatingsParams(valueObservable(filters))
  );

  return render(RatingsToolbar, {
    props: {
      params,
      dividers: useDividers(),
      controls: toolbarControls(),
      ...props,
    },
  });
}

const button = (name: string) => screen.getByRole('button', { name });

beforeEach(() => {
  stubClientRects();
});

describe('section: RatingsToolbar', () => {
  describe('type menu', () => {
    it('should list All Types and the four types, All checked', async () => {
      await renderToolbar();

      await openMenuByClick('Type: All Types', 'Type');

      expect(readMenuRows('menuitemradio'))
        .toEqual(['All Types', 'Movies', 'Shows', 'Seasons', 'Episodes']);
      expect(readCheckedMenuRow()).toBe('All Types');
    });

    it('should show the type the path holds', async () => {
      await renderToolbar({ filters: 'seasons/all' });

      expect(button('Type: Seasons')).toHaveTextContent(/^Seasons$/);
    });

    it('should push a picked type, keeping the search but the page', async () => {
      await renderToolbar({ search: '?fade=watched&page=3' });
      await openMenuByClick('Type: All Types', 'Type');

      await pickMenuRadio('Movies');

      await waitFor(() =>
        expect(lastPush()).toBe(`${RATINGS_PATH}/movies/all?fade=watched`)
      );
    });

    it('should push the bare path on a pick of the All row', async () => {
      await renderToolbar({ filters: 'shows/all' });
      await openMenuByClick('Type: Shows', 'Type');

      await pickMenuRadio('All Types');

      await waitFor(() => expect(lastPush()).toBe(RATINGS_PATH));
    });

    it('should write nothing and close the panel on a pick of the checked row again', async () => {
      const close = vi.fn();
      await renderToolbar({
        filters: 'movies/all',
        controls: toolbarControls({ close }),
      });
      await openMenuByClick('Type: Movies', 'Type');

      await pickMenuRadio('Movies');
      await waitNegativeClaim();

      expect(goto).not.toHaveBeenCalled();
      expect(close).toHaveBeenCalledOnce();
    });

    it('should sit in the start block, alone', async () => {
      const { container } = await renderToolbar();

      const start = assertDefined(container.querySelector<HTMLElement>(
        '.toolbar-start',
      ));

      expect(ariaLabelsOf(within(start).getAllByRole('button')))
        .toEqual(['Type: All Types']);
    });

    it('should close the panel on a pick that changes the type', async () => {
      const close = vi.fn();
      await renderToolbar({ controls: toolbarControls({ close }) });
      await openMenuByClick('Type: All Types', 'Type');

      await pickMenuRadio('Movies');
      await waitFor(() => expect(goto).toHaveBeenCalledOnce());

      expect(close).toHaveBeenCalledOnce();
    });
  });

  describe('stats', () => {
    it('should leave the item count blank while it loads, its word unmarked', async () => {
      await renderToolbar();

      expect(countStat('Items')).toHaveTextContent(/^Items$/);
      expect(countStat('Items')).not.toHaveAttribute('data-label');
    });

    it('should show the item count, with its word wide', async () => {
      await renderToolbar({ itemCount: 641 });

      expect(countStat('Items')).toHaveTextContent(/^641 Items$/);
      expect(countStat('Items')).toHaveAttribute('data-label', 'wide');
    });
  });

  describe('rating menu', () => {
    it('should list All Ratings, then 10 down to 1 as plain text, All checked', async () => {
      await renderToolbar();

      await openMenuByClick('Rating: All Ratings', 'Rating');

      expect(readMenuRows('menuitemradio')).toEqual([
        'All Ratings',
        '10 - Totally Ninja!',
        '9 - Superb',
        '8 - Great',
        '7 - Good',
        '6 - Fair',
        '5 - Meh',
        '4 - Poor',
        '3 - Bad',
        '2 - Terrible',
        '1 - Weak Sauce :(',
      ]);
      expect(readCheckedMenuRow()).toBe('All Ratings');
    });

    it('should show the rating the path holds', async () => {
      await renderToolbar({ filters: 'all/8' });

      expect(button('Rating: 8 - Great')).toHaveTextContent(/^8 - Great$/);
    });

    it('should push a picked rating, keeping the type and the search but the page', async () => {
      await renderToolbar({
        filters: 'movies/all',
        search: '?hide=watched&page=3',
      });
      await openMenuByClick('Rating: All Ratings', 'Rating');

      await pickMenuRadio('8 - Great');

      await waitFor(() =>
        expect(lastPush()).toBe(`${RATINGS_PATH}/movies/8?hide=watched`)
      );
    });

    it('should push the bare path on a pick of All Ratings under All Types', async () => {
      await renderToolbar({ filters: 'all/8' });
      await openMenuByClick('Rating: 8 - Great', 'Rating');

      await pickMenuRadio('All Ratings');

      await waitFor(() => expect(lastPush()).toBe(RATINGS_PATH));
    });

    it('should sit in the options', async () => {
      const { container } = await renderToolbar();

      expect(container.querySelector(`#${PANEL_ID}`))
        .toContainElement(button('Rating: All Ratings'));
    });

    it('should close the panel on a pick that changes the value', async () => {
      const close = vi.fn();
      await renderToolbar({ controls: toolbarControls({ close }) });
      await openMenuByClick('Rating: All Ratings', 'Rating');

      await pickMenuRadio('8 - Great');

      expect(close).toHaveBeenCalledOnce();
    });

    it.each([
      { filters: '', trigger: 'Rating: All Ratings', row: 'All Ratings' },
      { filters: 'all/8', trigger: 'Rating: 8 - Great', row: '8 - Great' },
    ])(
      'should write nothing and close the panel on a pick of the checked $row row',
      async ({ filters, trigger, row }) => {
        const close = vi.fn();
        await renderToolbar({ filters, controls: toolbarControls({ close }) });
        await openMenuByClick(trigger, 'Rating');

        await pickMenuRadio(row);
        await waitNegativeClaim();

        expect(goto).not.toHaveBeenCalled();
        expect(close).toHaveBeenCalledOnce();
      },
    );
  });

  describe('dividers toggle', () => {
    // The panel hides on phones until the gear opens it; the toggle stays.
    it('should follow the panel, outside it', async () => {
      await renderToolbar();

      const panel = assertDefined(controlledBy(button('Options')));
      expect(panel.compareDocumentPosition(button('Toggle Dividers')))
        .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('should flip the instance the screen hands it', async () => {
      const dividers = useDividers();
      await renderToolbar({ dividers });

      await userEvent.click(button('Toggle Dividers'));

      expect(await readKnown(dividers.shown)).toBe(false);
    });
  });

  describe('eye', () => {
    it('should replace the URL on a pick, keeping the page', async () => {
      await renderToolbar({ search: '?page=2' });
      await openMenuByClick('Filters', 'Filters');

      await pickMenuRadio('Hide watched');

      await waitFor(() => expectOneReplace());
      expect(lastReplace()).toBe(`${RATINGS_PATH}?page=2&hide=watched`);
    });

    it('should show the filter the URL holds', async () => {
      await renderToolbar({ search: '?fade=watched' });

      await openMenuByClick('Filters', 'Filters');

      expect(readCheckedMenuRow()).toBe('Fade watched');
    });

    it('should leave the panel alone on a pick, outside it', async () => {
      const close = vi.fn();
      const { container } = await renderToolbar({
        controls: toolbarControls({ close }),
      });
      expect(container.querySelector(`#${PANEL_ID}`))
        .not.toContainElement(button('Filters'));
      await openMenuByClick('Filters', 'Filters');

      await pickMenuRadio('Fade watched');
      await waitFor(() => expectOneReplace());
      await waitNegativeClaim();

      expect(close).not.toHaveBeenCalled();
    });
  });

  describe('the frame', () => {
    it('should hold the controls in order, the gear before the panel and the toggle and the eye after it', async () => {
      await renderToolbar();

      expect(ariaLabelsOf(screen.getAllByRole('button'))).toEqual([
        'Options',
        'Type: All Types',
        'Rating: All Ratings',
        'Toggle Dividers',
        'Filters',
      ]);
    });
  });

  describe('the phone gear', () => {
    it('should control the panel that holds the type menu, then the rating menu', async () => {
      await renderToolbar();

      const panel = assertDefined(controlledBy(button('Options')));

      expect(ariaLabelsOf(within(panel).getAllByRole('button')))
        .toEqual(['Type: All Types', 'Rating: All Ratings']);
    });

    it('should press through to the toggle the controls carry', async () => {
      const toggle = vi.fn();
      await renderToolbar({ controls: toolbarControls({ toggle }) });

      await userEvent.click(button('Options'));

      expect(toggle).toHaveBeenCalledOnce();
    });

    it.each([true, false])(
      'should mark the panel open %s',
      async (open) => {
        const { container } = await renderToolbar({
          controls: toolbarControls({ open }),
        });

        expect(
          container.querySelector(`#${PANEL_ID}`)?.classList
            .contains('is-open'),
        ).toBe(open);
      },
    );
  });

  describe('off the default', () => {
    it('should draw no trigger in the accent and dot no gear at the defaults', async () => {
      await renderToolbar();

      expect([
        isTriggerChanged('Type: All Types'),
        isTriggerChanged('Rating: All Ratings'),
        isGearDotted(),
      ]).toEqual([false, false, false]);
    });

    it.each([
      ['type', 'shows', 'Type: Shows'],
      ['rating', 'all/8', 'Rating: 8 - Great'],
    ])('should accent the %s and dot the gear', async (_, filters, name) => {
      await renderToolbar({ filters });

      expect([isTriggerChanged(name), isGearDotted()]).toEqual([true, true]);
    });

    it('should leave the gear undotted by the eye, which stays in the row', async () => {
      await renderToolbar({ search: '?hide=watched' });

      expect(isGearDotted()).toBe(false);
    });
  });
});
