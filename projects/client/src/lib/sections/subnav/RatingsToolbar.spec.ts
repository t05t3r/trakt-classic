import { goto } from '$app/navigation';
import { useRatingsParams } from '$lib/features/ratings/stores/useRatingsParams.ts';
import { useDividers } from '$lib/stores/useDividers.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { RATINGS_PATH } from '$mocks/data/users/RATINGS_PATH.ts';
import { controlledBy } from '$test/beds/dom/controlledBy.ts';
import { toolbarControls } from '$test/beds/lists/toolbarControls.ts';
import { openMenuByClick } from '$test/beds/menus/openMenuByClick.ts';
import { pickMenuRadio } from '$test/beds/menus/pickMenuRadio.ts';
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
const stat = (label: string) => screen.getByTitle(label);

const rowsOf = (menu: HTMLElement) =>
  within(menu).getAllByRole('menuitemradio');

const labelsOf = (rows: ReadonlyArray<HTMLElement>) =>
  rows.map((row) => row.textContent?.trim());

const ariaLabelsOf = (buttons: ReadonlyArray<HTMLElement>) =>
  buttons.map((found) => found.getAttribute('aria-label'));

beforeEach(() => {
  stubClientRects();
});

describe('section: RatingsToolbar', () => {
  describe('type menu', () => {
    it('should list All Types and the four types, All checked', async () => {
      await renderToolbar();

      const rows = rowsOf(await openMenuByClick('Type: All Types', 'Type'));

      expect(labelsOf(rows))
        .toEqual(['All Types', 'Movies', 'Shows', 'Seasons', 'Episodes']);
      expect(rows.at(0)).toHaveAttribute('aria-checked', 'true');
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

    it('should write nothing on a pick of the checked row again', async () => {
      await renderToolbar({ filters: 'movies/all' });
      await openMenuByClick('Type: Movies', 'Type');

      await pickMenuRadio('Movies');
      await waitNegativeClaim();

      expect(goto).not.toHaveBeenCalled();
    });

    it('should sit in the start block, alone', async () => {
      const { container } = await renderToolbar();

      const start = assertDefined(container.querySelector<HTMLElement>(
        '.toolbar-start',
      ));

      expect(ariaLabelsOf(within(start).getAllByRole('button')))
        .toEqual(['Type: All Types']);
    });

    it('should leave the panel alone on a pick, outside it', async () => {
      const close = vi.fn();
      await renderToolbar({ controls: toolbarControls({ close }) });
      await openMenuByClick('Type: All Types', 'Type');

      await pickMenuRadio('Movies');
      await waitFor(() => expect(goto).toHaveBeenCalledOnce());
      await waitNegativeClaim();

      expect(close).not.toHaveBeenCalled();
    });
  });

  describe('stats', () => {
    it('should leave the item count blank while it loads, its word unmarked', async () => {
      await renderToolbar();

      expect(stat('Items')).toHaveTextContent(/^Items$/);
      expect(stat('Items')).not.toHaveAttribute('data-label');
    });

    it('should show the item count, with its word wide', async () => {
      await renderToolbar({ itemCount: 641 });

      expect(stat('Items')).toHaveTextContent(/^641 Items$/);
      expect(stat('Items')).toHaveAttribute('data-label', 'wide');
    });
  });

  describe('rating menu', () => {
    it('should list All Ratings, then 10 down to 1 as plain text, All checked', async () => {
      await renderToolbar();

      const rows = rowsOf(
        await openMenuByClick('Rating: All Ratings', 'Rating'),
      );

      expect(labelsOf(rows)).toEqual([
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
      expect(rows.at(0)).toHaveAttribute('aria-checked', 'true');
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
      'should write nothing and leave the panel open on a pick of the checked $row row',
      async ({ filters, trigger, row }) => {
        const close = vi.fn();
        await renderToolbar({ filters, controls: toolbarControls({ close }) });
        await openMenuByClick(trigger, 'Rating');

        await pickMenuRadio(row);
        await waitNegativeClaim();

        expect(goto).not.toHaveBeenCalled();
        expect(close).not.toHaveBeenCalled();
      },
    );
  });

  describe('sort', () => {
    it('should list Rated Date alone, checked', async () => {
      await renderToolbar();

      const rows = rowsOf(
        await openMenuByClick('Sort by: Rated Date', 'Sort by'),
      );

      expect(labelsOf(rows)).toEqual(['Rated Date']);
      expect(rows.at(0)).toHaveAttribute('aria-checked', 'true');
    });

    it('should write nothing and leave the panel open on a pick of its one row', async () => {
      const close = vi.fn();
      await renderToolbar({ controls: toolbarControls({ close }) });
      await openMenuByClick('Sort by: Rated Date', 'Sort by');

      await pickMenuRadio('Rated Date');
      await waitNegativeClaim();

      expect(goto).not.toHaveBeenCalled();
      expect(close).not.toHaveBeenCalled();
    });

    it('should follow the rating menu in the options, in its own margin box', async () => {
      const { container } = await renderToolbar();

      const options = assertDefined(container.querySelector<HTMLElement>(
        `#${PANEL_ID}`,
      ));

      expect(ariaLabelsOf(within(options).getAllByRole('button')))
        .toEqual(['Rating: All Ratings', 'Sort by: Rated Date']);
      expect(options.querySelector('.toolbar-sort'))
        .toContainElement(button('Sort by: Rated Date'));
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

      const rows = rowsOf(await openMenuByClick('Filters', 'Filters'));

      expect(rows.at(0)).toHaveAttribute('aria-checked', 'true');
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
    it('should keep the controls on phones', async () => {
      const { container } = await renderToolbar();

      expect(container.querySelector('.trakt-subnav-toolbar'))
        .toHaveAttribute('data-phone', 'controls');
    });

    it('should hold the controls in order, the gear before the toggle and the eye', async () => {
      await renderToolbar({ controls: toolbarControls({ untitled: {} }) });

      expect(ariaLabelsOf(screen.getAllByRole('button'))).toEqual([
        'Type: All Types',
        'Rating: All Ratings',
        'Sort by: Rated Date',
        'Options',
        'Toggle Dividers',
        'Filters',
      ]);
    });
  });

  describe('the phone gear', () => {
    it('should control the panel that holds the rating and sort menus', async () => {
      await renderToolbar({ controls: toolbarControls({ untitled: {} }) });

      const panel = assertDefined(controlledBy(button('Options')));

      expect(panel).toContainElement(button('Rating: All Ratings'));
      expect(panel).toContainElement(button('Sort by: Rated Date'));
    });

    it('should press through to the toggle the controls carry', async () => {
      const toggle = vi.fn();
      await renderToolbar({
        controls: toolbarControls({ untitled: { toggle } }),
      });

      await userEvent.click(button('Options'));

      expect(toggle).toHaveBeenCalledOnce();
    });

    it.each([true, false])(
      'should mark the panel open %s',
      async (open) => {
        const { container } = await renderToolbar({
          controls: toolbarControls({ untitled: {}, open }),
        });

        expect(
          container.querySelector(`#${PANEL_ID}`)?.classList
            .contains('is-open'),
        ).toBe(open);
      },
    );
  });
});
