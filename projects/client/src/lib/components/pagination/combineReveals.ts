import type { RowReveal } from './RowReveal.ts';

// One navigator for several grids that share a row count.
export function combineReveals(
  reveals: ReadonlyArray<RowReveal | Nil>,
): RowReveal | undefined {
  const reported = reveals.filter((reveal) => reveal != null);
  if (reported.length === 0) return undefined;

  return {
    openRows: Math.max(...reported.map((reveal) => reveal.openRows)),
    showLess: reported.some((reveal) => reveal.showLess),
    showMore: reported.some((reveal) => reveal.showMore),
  };
}
