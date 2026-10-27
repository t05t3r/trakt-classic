import { FakeMediaQueryList } from '$test/beds/css/FakeMediaQueryList.ts';
import { afterAll, vi } from 'vitest';

// Maps each layout to the one query it matches; `null` matches none.
type LayoutQueries<Layout extends string> = Readonly<
  Record<Layout, string | null>
>;

// Call at the top of a spec; returns the setter that switches layouts.
// No layout matches until the setter's first call.
export function fakeLayouts<Layout extends string>(
  queries: LayoutQueries<Layout>,
): (layout: Layout) => void {
  let current: Layout | undefined;
  const lists = new Map<string, FakeMediaQueryList>();
  const isMatch = (media: string) =>
    current !== undefined && media === queries[current];

  const spy = vi.spyOn(globalThis, 'matchMedia').mockImplementation(
    (query: string) => {
      const list = lists.get(query) ?? new FakeMediaQueryList(query, isMatch);
      lists.set(query, list);
      return list;
    },
  );
  afterAll(() => spy.mockRestore());

  // The media store keeps the first list per query, so a layout change reaches
  // it as a change event on that list.
  return (layout) => {
    current = layout;
    lists.forEach((list) => {
      list.dispatchEvent(
        Object.assign(new Event('change'), { matches: list.matches }),
      );
    });
  };
}
