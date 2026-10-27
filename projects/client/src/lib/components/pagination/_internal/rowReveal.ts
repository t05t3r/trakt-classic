import type { RowReveal } from '../RowReveal.ts';

type RowRevealProps = {
  itemCount: number;
  perRow: number;
  rowCount: number;
  rowMax: number;
};

export type RevealedRows = RowReveal & { visibleCount: number };

export function rowReveal(
  { itemCount, perRow, rowCount, rowMax }: RowRevealProps,
): RevealedRows {
  const filledRows = Math.min(Math.ceil(itemCount / perRow), rowMax);
  const openRows = Math.min(rowCount, filledRows);

  return {
    visibleCount: Math.min(itemCount, openRows * perRow),
    openRows,
    showLess: openRows > 1,
    showMore: openRows < filledRows,
  };
}
