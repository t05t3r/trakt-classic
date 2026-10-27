import type { SortParam } from '$lib/features/view-params/stores/useSortParam.ts';
import { glyphClasses } from '$test/beds/menus/glyphClasses.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { render, screen, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import SortableBlock from './SortableBlock.svelte';
import type { SortableBlockProps } from './SortableBlockProps.ts';

type Thing = { number: number; key: string; name: string; isWatched: boolean };
type ThingSort = 'number' | 'name';

const PATH = '/things';

const THINGS: ReadonlyArray<Thing> = [
  { number: 2, key: 'thing-2', name: 'Beta', isWatched: true },
  { number: 1, key: 'thing-1', name: 'Gamma', isWatched: false },
  { number: 3, key: 'thing-3', name: 'Alpha', isWatched: false },
];

// Reads a name as the code of its first letter, so a sort by it reads plainly.
const nameValue = ({ name }: Thing) => name.charCodeAt(0);

function apply(
  { items, sort }: { items: ReadonlyArray<Thing>; sort: SortParam<ThingSort> },
) {
  const direction = sort.how === 'asc' ? 1 : -1;
  const valueOf = sort.by === 'name'
    ? nameValue
    : (thing: Thing) => thing.number;
  return items.toSorted((a, b) => (valueOf(a) - valueOf(b)) * direction);
}

const title = createRawSnippet(() => ({ render: () => '<span>Things</span>' }));

const item = createRawSnippet((thing: () => Thing) => ({
  render: () => `<h3>${thing().name}</h3>`,
}));

const PROPS: SortableBlockProps<Thing, ThingSort> = {
  title,
  status: { kind: 'ready', data: THINGS },
  emptyText: 'No things.',
  sort: {
    param: 'things',
    sorts: [{ by: 'number', how: 'asc' }, { by: 'name', how: 'desc' }],
    labels: { number: () => 'Number', name: () => 'Name' },
    apply,
  },
  isWatched: (thing) => thing.isWatched,
  grid: {
    key: (thing) => thing.key,
    columns: { desktop: 1, tabletLarge: 1, tabletSmall: 1, mobile: 1 },
    phoneDivider: 'none',
    phoneGaps: 'none',
  },
  item,
};

function renderBlock(
  props: Partial<SortableBlockProps<Thing, ThingSort>> = {},
) {
  return render(SortableBlock<Thing, ThingSort>, {
    props: { ...PROPS, ...props },
  });
}

function names() {
  return screen.queryAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent);
}

function cellOf(container: HTMLElement, name: string): HTMLElement {
  const cell = [...container.querySelectorAll<HTMLElement>('.sortable-item')]
    .find((found) => found.querySelector('h3')?.textContent === name);
  if (!cell) throw new Error(`no cell named ${name}`);
  return cell;
}

describe('component: SortableBlock', () => {
  it('should title the block with its title', () => {
    openAt(PATH);
    renderBlock();

    expect(screen.getByRole('heading', { level: 2 }))
      .toHaveTextContent(/^Things$/);
  });

  it('should list the items in the first sort at its default direction', () => {
    openAt(PATH);
    renderBlock();

    expect(names()).toEqual(['Gamma', 'Beta', 'Alpha']);
  });

  it('should sort the items as the URL asks', () => {
    openAt(`${PATH}?things=name,asc`);
    renderBlock();

    expect(names()).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(screen.getByRole('button', { name: 'Sort by: Name' }))
      .toHaveTextContent(/^Name$/);
  });

  it('should lay the grid out with the columns, key, divider and phone gaps it is given', () => {
    openAt(PATH);
    const { container } = renderBlock();

    const grid = container.querySelector<HTMLElement>('.trakt-poster-grid');
    expect(grid).toHaveAttribute('data-phone-divider', 'none');
    expect(grid).toHaveAttribute('data-phone-gaps', 'none');
    expect(grid?.style.getPropertyValue('--poster-grid-columns-desktop'))
      .toBe('1');
  });

  it('should list the sorts in their order with the selected one checked', async () => {
    stubClientRects();
    openAt(`${PATH}?things=name,asc`);
    renderBlock();

    await userEvent.click(
      screen.getByRole('button', { name: 'Sort by: Name' }),
    );
    const menu = await screen.findByRole('menu', { name: 'Sort by' });
    const rows = within(menu).getAllByRole('menuitemradio');

    expect(rows.map((row) => row.textContent?.trim()))
      .toEqual(['Number', 'Name']);
    expect(rows.map((row) => row.getAttribute('aria-checked')))
      .toEqual(['false', 'true']);
  });

  it('should sort by a chosen entry from its own default direction', async () => {
    stubClientRects();
    openAt(PATH);
    renderBlock();

    await userEvent.click(
      screen.getByRole('button', { name: 'Sort by: Number' }),
    );
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Name' }),
    );

    expect(lastReplace()).toBe(`${PATH}?things=name,desc`);
  });

  it.each([
    { search: '', pressed: 'false', glyph: 'arrow-down' },
    { search: '?things=name,desc', pressed: 'false', glyph: 'arrow-down' },
    { search: '?things=number,desc', pressed: 'true', glyph: 'arrow-up' },
    { search: '?things=name,asc', pressed: 'true', glyph: 'arrow-up' },
  ])(
    "should point the direction toggle's arrow $glyph at $search",
    ({ search, pressed, glyph }) => {
      openAt(`${PATH}${search}`);
      renderBlock();

      const toggle = screen.getByRole('button', { name: 'Direction' });
      expect(toggle).toHaveAttribute('aria-pressed', pressed);
      expect(glyphClasses(toggle)).toEqual([
        expect.stringContaining(`tabler-icon-${glyph}`),
      ]);
    },
  );

  it('should reverse the sort from the direction toggle', async () => {
    openAt(PATH);
    renderBlock();

    await userEvent.click(screen.getByRole('button', { name: 'Direction' }));

    expect(lastReplace()).toBe(`${PATH}?things=number,desc`);
  });

  it('should fade the watched items under Fade watched', () => {
    openAt(`${PATH}?fade=watched`);
    const { container } = renderBlock();

    expect(cellOf(container, 'Beta')).toHaveClass('is-faded');
    expect(cellOf(container, 'Gamma')).not.toHaveClass('is-faded');
  });

  it('should leave the items unfaded without a filter', () => {
    openAt(PATH);
    const { container } = renderBlock();

    expect(cellOf(container, 'Beta')).not.toHaveClass('is-faded');
  });

  it('should hide the watched items under Hide watched', () => {
    openAt(`${PATH}?hide=watched`);
    renderBlock();

    expect(names()).toEqual(['Gamma', 'Alpha']);
  });

  it('should keep the header alone when Hide watched hides every item', () => {
    openAt(`${PATH}?hide=watched`);
    renderBlock({ isWatched: () => true });

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Things',
    );
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryByText('No things.')).toBeNull();
  });

  it('should set the watched filter from the eye menu', async () => {
    stubClientRects();
    openAt(`${PATH}?things=name,asc`);
    renderBlock();

    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Hide watched' }),
    );

    expect(lastReplace()).toBe(`${PATH}?things=name,asc&hide=watched`);
  });

  it('should say so when there are no items', () => {
    openAt(PATH);
    renderBlock({ status: { kind: 'empty' } });

    expect(screen.getByText('No things.')).toBeInTheDocument();
  });
});
