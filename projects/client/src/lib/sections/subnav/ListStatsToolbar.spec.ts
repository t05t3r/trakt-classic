import { goto } from '$app/navigation';
import { LIST_TYPES } from '$lib/features/lists/LIST_TYPES.ts';
import { useListParams } from '$lib/features/lists/stores/useListParams.ts';
import { FAVORITES_PATH } from '$mocks/data/users/FAVORITES_PATH.ts';
import { WATCHLIST_PATH } from '$mocks/data/users/WATCHLIST_PATH.ts';
import { glyphClasses } from '$test/beds/menus/glyphClasses.ts';
import { openMenuByClick } from '$test/beds/menus/openMenuByClick.ts';
import { pickMenuRadio } from '$test/beds/menus/pickMenuRadio.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { toolbarControls } from '$test/beds/lists/toolbarControls.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { render, screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ListStatsToolbar from './ListStatsToolbar.svelte';
import type { ListStatsToolbarProps } from './_internal/ListStatsToolbarProps.ts';

type WatchlistType = (typeof LIST_TYPES.watchlist)[number];
type ToolbarValues = Partial<
  Omit<ListStatsToolbarProps<WatchlistType>, 'params'>
>;

const { panelId: PANEL_ID } = toolbarControls();

type ToolbarScreen = {
  path?: string;
  search?: string;
  types?: ReadonlyArray<WatchlistType>;
};

async function renderToolbar(
  {
    path = WATCHLIST_PATH,
    search = '',
    types = LIST_TYPES.watchlist,
    ...props
  }: ToolbarValues & ToolbarScreen = {},
) {
  openAt(`${path}${search}`);
  const params = await renderStore(() => useListParams({ types }));

  return render(ListStatsToolbar<WatchlistType>, {
    props: {
      params,
      controls: toolbarControls(),
      ...props,
    },
  });
}

const button = (name: string) => screen.getByRole('button', { name });
const stat = (label: string) => screen.getByTitle(label);

function rowsOf(menu: HTMLElement) {
  return within(menu).getAllByRole('menuitemradio');
}

const labelsOf = (rows: ReadonlyArray<HTMLElement>) =>
  rows.map((row) => row.textContent?.trim());

beforeEach(() => {
  stubClientRects();
});

describe('section: ListStatsToolbar', () => {
  describe('type menu', () => {
    it("should list All Types and the screen's types, All checked", async () => {
      await renderToolbar();

      const rows = rowsOf(await openMenuByClick('Type: All Types', 'Type'));

      expect(labelsOf(rows))
        .toEqual(['All Types', 'Movies', 'Shows', 'Seasons', 'Episodes']);
      expect(rows.at(0)).toHaveAttribute('aria-checked', 'true');
    });

    it('should list only the types the params were given', async () => {
      await renderToolbar({
        path: FAVORITES_PATH,
        types: LIST_TYPES.favorites,
      });

      const rows = rowsOf(await openMenuByClick('Type: All Types', 'Type'));

      expect(labelsOf(rows)).toEqual(['All Types', 'Movies', 'Shows']);
    });

    it('should show the type the URL holds', async () => {
      await renderToolbar({ search: '?display=season' });

      expect(button('Type: Seasons')).toHaveTextContent(/^Seasons$/);
    });

    it('should write a picked type', async () => {
      await renderToolbar();
      await openMenuByClick('Type: All Types', 'Type');

      await pickMenuRadio('Movies');

      await waitFor(() =>
        expect(lastReplace()).toBe(`${WATCHLIST_PATH}?display=movie`)
      );
    });
  });

  describe('genre menu', () => {
    it('should list All Genres then the genres by name, capped in height', async () => {
      await renderToolbar();

      const menu = await openMenuByClick('Genre: All Genres', 'Genre');
      const labels = labelsOf(rowsOf(menu));

      expect(labels).toHaveLength(25);
      expect(labels.slice(0, 3)).toEqual(['All Genres', 'Action', 'Adventure']);
      expect(labels).toContain('Science Fiction');
      expect(menu).toHaveAttribute('data-limited');
    });

    it('should write a picked genre', async () => {
      await renderToolbar({ search: '?genres=horror' });
      await openMenuByClick('Genre: Horror', 'Genre');

      await pickMenuRadio('Drama');

      await waitFor(() =>
        expect(lastReplace()).toBe(`${WATCHLIST_PATH}?genres=drama`)
      );
    });
  });

  describe('sort', () => {
    it('should list the nine sorts with the current one checked', async () => {
      await renderToolbar({ search: '?sort=votes,desc' });

      const rows = rowsOf(await openMenuByClick('Sort by: Votes', 'Sort by'));

      expect(labelsOf(rows)).toEqual([
        'Rank',
        'Added Date',
        'Title',
        'Release Date',
        'Runtime',
        'Popularity',
        'Rating',
        'Votes',
        'My Rating',
      ]);
      expect(rows.at(7)).toHaveAttribute('aria-checked', 'true');
    });

    it('should write a picked sort at its default direction', async () => {
      await renderToolbar();
      await openMenuByClick('Sort by: Rank', 'Sort by');

      await pickMenuRadio('Title');

      await waitFor(() =>
        expect(lastReplace()).toBe(`${WATCHLIST_PATH}?sort=title,asc`)
      );
    });

    it.each([
      { search: '', pressed: false, glyph: 'arrow-down' },
      { search: '?sort=rank,desc', pressed: true, glyph: 'arrow-up' },
      { search: '?sort=added,desc', pressed: true, glyph: 'arrow-up' },
      { search: '?sort=added,asc', pressed: false, glyph: 'arrow-down' },
    ])(
      'should point the direction $glyph, pressed $pressed, at $search',
      async ({ search, pressed, glyph }) => {
        await renderToolbar({ search });

        expect(button('Direction'))
          .toHaveAttribute('aria-pressed', String(pressed));
        expect(glyphClasses(button('Direction'))).toEqual([
          expect.stringContaining(`tabler-icon-${glyph}`),
        ]);
      },
    );

    it('should reverse the sort on a press of the direction', async () => {
      await renderToolbar({ search: '?sort=added,desc' });

      await userEvent.click(button('Direction'));

      await waitFor(() =>
        expect(lastReplace()).toBe(`${WATCHLIST_PATH}?sort=added,asc`)
      );
    });

    it('should write a picked watched filter', async () => {
      await renderToolbar();
      await openMenuByClick('Filters', 'Filters');

      await pickMenuRadio('Fade watched');

      await waitFor(() =>
        expect(lastReplace()).toBe(`${WATCHLIST_PATH}?fade=watched`)
      );
    });
  });

  describe('a choice', () => {
    it.each([
      { trigger: 'Type: All Types', menu: 'Type', pick: 'Movies' },
      { trigger: 'Genre: All Genres', menu: 'Genre', pick: 'Drama' },
      { trigger: 'Sort by: Rank', menu: 'Sort by', pick: 'Title' },
      { trigger: 'Filters', menu: 'Filters', pick: 'Fade watched' },
    ])(
      'should report a pick in the $menu menu',
      async ({ trigger, menu, pick }) => {
        const close = vi.fn();
        await renderToolbar({ controls: toolbarControls({ close }) });
        await openMenuByClick(trigger, menu);

        await pickMenuRadio(pick);

        expect(close).toHaveBeenCalledOnce();
      },
    );

    it('should report nothing on a pick of the checked sort row again', async () => {
      const close = vi.fn();
      await renderToolbar({ controls: toolbarControls({ close }) });
      await openMenuByClick('Sort by: Rank', 'Sort by');

      await pickMenuRadio('Rank');
      await waitNegativeClaim();

      expect(goto).not.toHaveBeenCalled();
      expect(close).not.toHaveBeenCalled();
    });

    it('should report a press of the direction', async () => {
      const close = vi.fn();
      await renderToolbar({ controls: toolbarControls({ close }) });

      await userEvent.click(button('Direction'));

      expect(close).toHaveBeenCalledOnce();
    });
  });

  describe('stats', () => {
    it('should leave every count blank while the items load', async () => {
      await renderToolbar();

      expect(stat('Watched')).toHaveTextContent(/^Watched$/);
      expect(stat('Runtime')).toHaveTextContent(/^Runtime$/);
      expect(stat('Items')).toHaveTextContent(/^Items$/);
    });

    it('should show the watched percentage over its under-count', async () => {
      await renderToolbar({
        watched: { watched: 1234, count: 4567, percentage: 27 },
      });

      expect(stat('Watched'))
        .toHaveTextContent(/^27% Watched 1,234 \/ 4,567 items$/);
    });

    it('should show the item count', async () => {
      await renderToolbar({ itemCount: 1234 });

      expect(stat('Items')).toHaveTextContent(/^1,234 Items$/);
    });

    it.each([
      { pageCount: undefined, minutes: 90 },
      { pageCount: 1, minutes: undefined },
    ])(
      'should leave the runtime blank at $pageCount pages and $minutes minutes',
      async ({ pageCount, minutes }) => {
        await renderToolbar({ pageCount, minutes });

        expect(stat('Runtime')).toHaveTextContent(/^Runtime$/);
      },
    );

    it('should show the runtime of a one-page List', async () => {
      await renderToolbar({ pageCount: 1, minutes: 90 });

      expect(stat('Runtime')).toHaveTextContent(/^1h 30m Runtime$/);
    });

    it('should drop the runtime past one page', async () => {
      await renderToolbar({ pageCount: 2, minutes: 90 });

      expect(screen.queryByTitle('Runtime')).toBeNull();
    });
  });

  describe('options panel', () => {
    it('should hold the menus and toggles under its id', async () => {
      const { container } = await renderToolbar();

      const panel = container.querySelector<HTMLElement>(`#${PANEL_ID}`);

      expect(panel).not.toBeNull();
      expect(
        within(panel ?? container).getAllByRole('button')
          .map((found) => found.getAttribute('aria-label')),
      ).toEqual([
        'Type: All Types',
        'Genre: All Genres',
        'Sort by: Rank',
        'Direction',
        'Filters',
      ]);
    });

    it('should fill no start block, the filters holding the row start', async () => {
      const { container } = await renderToolbar();

      expect(container.querySelector('.toolbar-start')).toBeNull();
      expect(container.querySelector('.toolbar-filters')).not.toBeNull();
    });

    it('should group the direction and watched toggles apart from the sort menu', async () => {
      await renderToolbar();

      const toggles = button('Direction').closest('.toolbar-toggles');

      expect(toggles).toContainElement(button('Filters'));
      expect(toggles).not.toContainElement(button('Sort by: Rank'));
    });
  });

  describe('without a title bar', () => {
    it('should hold the spinner and the gear its controls carry', async () => {
      const { container } = await renderToolbar({
        controls: toolbarControls({
          untitled: { gearId: 'list-gear', loading: true },
        }),
      });

      expect(container.querySelector('.trakt-pending-spinner')).not.toBeNull();
      expect(screen.getByRole('button', { name: 'Options' }))
        .toHaveAttribute('id', 'list-gear');
    });
  });
});
