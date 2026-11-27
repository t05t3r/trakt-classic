import { isGearDotted } from '$test/beds/subnav/isGearDotted.ts';
import { isTriggerChanged } from '$test/beds/subnav/isTriggerChanged.ts';
import { countStat } from '$test/beds/stats/countStat.ts';
import { queryCountStat } from '$test/beds/stats/queryCountStat.ts';
import { goto } from '$app/navigation';
import { LIST_TYPES } from '$lib/features/lists/LIST_TYPES.ts';
import { useListParams } from '$lib/features/lists/stores/useListParams.ts';
import { FAVORITES_PATH } from '$mocks/data/users/FAVORITES_PATH.ts';
import { WATCHLIST_PATH } from '$mocks/data/users/WATCHLIST_PATH.ts';
import { ariaLabelsOf } from '$test/beds/dom/ariaLabelsOf.ts';
import { glyphClasses } from '$test/beds/menus/glyphClasses.ts';
import { openMenuByClick } from '$test/beds/menus/openMenuByClick.ts';
import { pickMenuRadio } from '$test/beds/menus/pickMenuRadio.ts';
import { readCheckedMenuRow } from '$test/beds/menus/readCheckedMenuRow.ts';
import { readMenuRows } from '$test/beds/menus/readMenuRows.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { toolbarControls } from '$test/beds/lists/toolbarControls.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { followReplaces } from '$test/beds/url/followReplaces.svelte.ts';
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
      hasWatchedShare: true,
      controls: toolbarControls(),
      ...props,
    },
  });
}

const button = (name: string) => screen.getByRole('button', { name });

beforeEach(() => {
  stubClientRects();
});

describe('section: ListStatsToolbar', () => {
  describe('type menu', () => {
    it("should list All Types and the screen's types, All checked", async () => {
      await renderToolbar();

      await openMenuByClick('Type: All Types', 'Type');

      expect(readMenuRows('menuitemradio'))
        .toEqual(['All Types', 'Movies', 'Shows', 'Seasons', 'Episodes']);
      expect(readCheckedMenuRow()).toBe('All Types');
    });

    it('should list only the types the params were given', async () => {
      await renderToolbar({
        path: FAVORITES_PATH,
        types: LIST_TYPES.favorites,
      });

      await openMenuByClick('Type: All Types', 'Type');

      expect(readMenuRows('menuitemradio'))
        .toEqual(['All Types', 'Movies', 'Shows']);
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
      const labels = readMenuRows('menuitemradio');

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

      await openMenuByClick('Sort by: Votes', 'Sort by');

      expect(readMenuRows('menuitemradio')).toEqual([
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
      expect(readCheckedMenuRow()).toBe('Votes');
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

    it.each([
      { trigger: 'Type: All Types', menu: 'Type', pick: 'All Types' },
      { trigger: 'Genre: All Genres', menu: 'Genre', pick: 'All Genres' },
      { trigger: 'Sort by: Rank', menu: 'Sort by', pick: 'Rank' },
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

    it('should leave the panel alone on a pick of the watched filter, outside it', async () => {
      const close = vi.fn();
      const { container } = await renderToolbar({
        controls: toolbarControls({ close }),
      });
      expect(container.querySelector(`#${PANEL_ID}`))
        .not.toContainElement(button('Filters'));
      await openMenuByClick('Filters', 'Filters');

      await pickMenuRadio('Fade watched');
      await waitFor(() =>
        expect(lastReplace()).toBe(`${WATCHLIST_PATH}?fade=watched`)
      );
      await waitNegativeClaim();

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

      expect(countStat('Watched')).toHaveTextContent(/^Watched$/);
      expect(countStat('Items')).toHaveTextContent(/^Items$/);
    });

    it('should show the watched percentage over its under-count', async () => {
      await renderToolbar({
        watched: { watched: 1234, count: 4567, percentage: 27 },
      });

      expect(countStat('Watched'))
        .toHaveTextContent(/^27% Watched 1,234 \/ 4,567 items$/);
    });

    it('should show no watched share for a list without one', async () => {
      await renderToolbar({ hasWatchedShare: false });

      expect(queryCountStat('Watched')).toBeNull();
      expect(countStat('Items')).toBeInTheDocument();
    });

    it('should show the item count', async () => {
      await renderToolbar({ itemCount: 1234 });

      expect(countStat('Items')).toHaveTextContent(/^1,234 Items$/);
    });

    it('should show no runtime before the page count is known', async () => {
      await renderToolbar({ minutes: 90 });

      expect(queryCountStat('Runtime')).toBeNull();
    });

    it("should leave a one-page List's runtime blank while its minutes load", async () => {
      await renderToolbar({ pageCount: 1 });

      expect(countStat('Runtime')).toHaveTextContent(/^Runtime$/);
    });

    it('should show the runtime of a one-page List', async () => {
      await renderToolbar({ pageCount: 1, minutes: 90 });

      expect(countStat('Runtime')).toHaveTextContent(/^1h 30m Runtime$/);
    });

    it('should drop the runtime past one page', async () => {
      await renderToolbar({ pageCount: 2, minutes: 90 });

      expect(queryCountStat('Runtime')).toBeNull();
    });
  });

  describe('options panel', () => {
    it('should hold the type, genre and sort menus and the direction under its id', async () => {
      const { container } = await renderToolbar();

      const panel = container.querySelector<HTMLElement>(`#${PANEL_ID}`);

      expect(panel).not.toBeNull();
      expect(ariaLabelsOf(within(panel ?? container).getAllByRole('button')))
        .toEqual([
          'Type: All Types',
          'Genre: All Genres',
          'Sort by: Rank',
          'Direction',
        ]);
    });

    it('should group the direction toggle apart from the sort menu', async () => {
      await renderToolbar();

      const toggles = button('Direction').closest('.toolbar-toggles');

      expect(toggles).not.toBeNull();
      expect(toggles).not.toContainElement(button('Sort by: Rank'));
    });

    it("should end the row with the watched filter, after the panel's controls", async () => {
      await renderToolbar();

      expect(ariaLabelsOf(screen.getAllByRole('button')).at(-1)).toBe(
        'Filters',
      );
    });
  });

  describe('the phone gear', () => {
    it('should lead the panel and the watched filter, under a title bar too', async () => {
      await renderToolbar({
        controls: toolbarControls({ gearId: 'list-gear' }),
      });

      expect(ariaLabelsOf(screen.getAllByRole('button'))).toEqual([
        'Options',
        'Type: All Types',
        'Genre: All Genres',
        'Sort by: Rank',
        'Direction',
        'Filters',
      ]);
      expect(button('Options')).toHaveAttribute('id', 'list-gear');
      expect(button('Options')).toHaveAttribute('aria-controls', PANEL_ID);
    });
  });

  describe('without a title bar', () => {
    it('should hold the spinner', async () => {
      const { container } = await renderToolbar({
        controls: toolbarControls({ loading: true }),
      });

      expect(container.querySelector('.trakt-pending-spinner')).not.toBeNull();
    });
  });

  describe('off the default', () => {
    it('should draw no trigger in the accent and dot no gear at the defaults', async () => {
      await renderToolbar();

      expect([
        isTriggerChanged('Type: All Types'),
        isTriggerChanged('Genre: All Genres'),
        isTriggerChanged('Sort by: Rank'),
        isGearDotted(),
      ]).toEqual([false, false, false, false]);
    });

    it.each([
      ['type', '?display=movie', 'Type: Movies'],
      ['genre', '?genres=drama', 'Genre: Drama'],
      ['sort', '?sort=title,asc', 'Sort by: Title'],
      ['sort reversed', '?sort=rank,desc', 'Sort by: Rank'],
    ])('should accent the %s and dot the gear', async (_, search, name) => {
      await renderToolbar({ search });

      expect([isTriggerChanged(name), isGearDotted()]).toEqual([true, true]);
    });

    it('should leave the gear undotted by the eye, which stays in the row', async () => {
      await renderToolbar({ search: '?hide=watched' });

      expect(isGearDotted()).toBe(false);
    });

    it('should dot the gear on a pick off the default and clear it on a pick back', async () => {
      followReplaces(WATCHLIST_PATH);
      const params = await renderStore(() =>
        useListParams({ types: LIST_TYPES.watchlist })
      );
      render(ListStatsToolbar<WatchlistType>, {
        props: { params, hasWatchedShare: true, controls: toolbarControls() },
      });

      await openMenuByClick('Genre: All Genres', 'Genre');
      await pickMenuRadio('Drama');
      await waitFor(() => expect(isGearDotted()).toBe(true));
      expect(isTriggerChanged('Genre: Drama')).toBe(true);

      await openMenuByClick('Genre: Drama', 'Genre');
      await pickMenuRadio('All Genres');
      await waitFor(() => expect(isGearDotted()).toBe(false));
      expect(isTriggerChanged('Genre: All Genres')).toBe(false);
    });
  });
});
