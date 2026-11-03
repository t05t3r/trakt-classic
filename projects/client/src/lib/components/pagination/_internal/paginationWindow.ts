import { clamp } from '$lib/utils/number/clamp.ts';

export type PaginationSlot = Readonly<
  { key: string } & ({ kind: 'page'; page: number } | { kind: 'gap' })
>;

export type PaginationWindow = Readonly<{
  current: number;
  slots: ReadonlyArray<PaginationSlot>;
}>;

const WINDOW_REACH = 2;
const WINDOW_WIDTH = WINDOW_REACH * 2 + 1;

function shownPages(
  { current, count }: { current: number; count: number },
): ReadonlyArray<number> {
  const start = clamp({
    value: current - WINDOW_REACH,
    min: 1,
    max: Math.max(1, count - WINDOW_WIDTH + 1),
  });
  const end = Math.min(start + WINDOW_WIDTH - 1, count);
  const around = Array.from(
    { length: end - start + 1 },
    (_, index) => start + index,
  );
  const edges = [1, 2, count - 1, count];

  return [...new Set([...edges, ...around])]
    .filter((page) => page >= 1 && page <= count)
    .toSorted((a, b) => a - b);
}

function pageSlot(page: number): PaginationSlot {
  return { key: `page-${page}`, kind: 'page', page };
}

function slotsBetween(
  { previous, page }: { previous: number | undefined; page: number },
): ReadonlyArray<PaginationSlot> {
  if (previous === undefined) return [];

  const skipped = page - previous - 1;
  if (skipped === 0) return [];
  if (skipped === 1) return [pageSlot(previous + 1)];

  return [{ key: `gap-${previous}`, kind: 'gap' }];
}

export function paginationWindow(
  { current, count }: { current: number; count: number },
): PaginationWindow {
  const clamped = clamp({ value: current, min: 1, max: count });
  const pages = shownPages({ current: clamped, count });
  const slots = pages.flatMap((page, index) => [
    ...slotsBetween({
      previous: index === 0 ? undefined : pages.at(index - 1),
      page,
    }),
    pageSlot(page),
  ]);

  return { current: clamped, slots };
}
