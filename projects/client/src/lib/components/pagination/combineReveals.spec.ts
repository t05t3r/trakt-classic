import { describe, expect, it } from 'vitest';
import { combineReveals } from './combineReveals.ts';
import type { RowReveal } from './RowReveal.ts';

// What a half-width column of up to 4 rows of 3 reports.
const FULL_AT_TWO_ROWS: RowReveal = {
  openRows: 2,
  showLess: true,
  showMore: true,
};
const FULL_AT_ONE_ROW: RowReveal = {
  openRows: 1,
  showLess: false,
  showMore: true,
};
const FULL_AT_ALL_ROWS: RowReveal = {
  openRows: 4,
  showLess: true,
  showMore: false,
};
const FIVE_AT_TWO_ROWS: RowReveal = {
  openRows: 2,
  showLess: true,
  showMore: false,
};
const ONE_SHORT_ROW: RowReveal = {
  openRows: 1,
  showLess: false,
  showMore: false,
};

describe('util: combineReveals', () => {
  it('should offer less and more when both full columns can step', () => {
    expect(combineReveals([FULL_AT_TWO_ROWS, FULL_AT_TWO_ROWS])).toEqual({
      openRows: 2,
      showLess: true,
      showMore: true,
    });
  });

  it('should step from the longer column when the counts differ', () => {
    expect(combineReveals([ONE_SHORT_ROW, FULL_AT_TWO_ROWS])).toEqual({
      openRows: 2,
      showLess: true,
      showMore: true,
    });
  });

  it('should offer more while one short column shows all it has', () => {
    expect(combineReveals([ONE_SHORT_ROW, FULL_AT_ONE_ROW])).toEqual({
      openRows: 1,
      showLess: false,
      showMore: true,
    });
  });

  it('should offer only less once one column reached its row limit', () => {
    expect(combineReveals([FULL_AT_ALL_ROWS, FIVE_AT_TWO_ROWS])).toEqual({
      openRows: 4,
      showLess: true,
      showMore: false,
    });
  });

  it('should read the one column that reports while the other does not', () => {
    expect(combineReveals([undefined, FULL_AT_TWO_ROWS])).toEqual({
      openRows: 2,
      showLess: true,
      showMore: true,
    });
    expect(combineReveals([ONE_SHORT_ROW, null])).toEqual({
      openRows: 1,
      showLess: false,
      showMore: false,
    });
  });

  it('should report nothing while no column reports', () => {
    expect(combineReveals([undefined, null])).toBeUndefined();
    expect(combineReveals([])).toBeUndefined();
  });
});
