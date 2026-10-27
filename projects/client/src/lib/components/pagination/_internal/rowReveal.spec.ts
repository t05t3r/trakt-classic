import { describe, expect, it } from 'vitest';
import { rowReveal } from './rowReveal.ts';

describe('util: rowReveal', () => {
  it('should show every row and only less when all rows are open', () => {
    expect(rowReveal({ itemCount: 17, perRow: 6, rowCount: 3, rowMax: 3 }))
      .toEqual({
        visibleCount: 17,
        openRows: 3,
        showLess: true,
        showMore: false,
      });
  });

  it('should show less and more while rows are open and rows are hidden', () => {
    expect(rowReveal({ itemCount: 18, perRow: 6, rowCount: 2, rowMax: 3 }))
      .toEqual({
        visibleCount: 12,
        openRows: 2,
        showLess: true,
        showMore: true,
      });
  });

  it('should show only more when a single row is open', () => {
    expect(rowReveal({ itemCount: 18, perRow: 6, rowCount: 1, rowMax: 3 }))
      .toEqual({
        visibleCount: 6,
        openRows: 1,
        showLess: false,
        showMore: true,
      });
  });

  it('should show neither when the items fill a single open row', () => {
    expect(rowReveal({ itemCount: 5, perRow: 6, rowCount: 1, rowMax: 3 }))
      .toEqual({
        visibleCount: 5,
        openRows: 1,
        showLess: false,
        showMore: false,
      });
  });

  it('should count the rows the items fill, not the rows allowed', () => {
    expect(rowReveal({ itemCount: 8, perRow: 6, rowCount: 2, rowMax: 3 }))
      .toEqual({
        visibleCount: 8,
        openRows: 2,
        showLess: true,
        showMore: false,
      });
  });

  it('should not offer more rows than the rows the items fill', () => {
    expect(rowReveal({ itemCount: 8, perRow: 6, rowCount: 3, rowMax: 3 }))
      .toEqual({
        visibleCount: 8,
        openRows: 2,
        showLess: true,
        showMore: false,
      });
  });

  it('should keep items beyond the row maximum hidden', () => {
    expect(rowReveal({ itemCount: 30, perRow: 6, rowCount: 3, rowMax: 3 }))
      .toEqual({
        visibleCount: 18,
        openRows: 3,
        showLess: true,
        showMore: false,
      });
  });

  it('should count rows in the columns of the current layout', () => {
    expect(rowReveal({ itemCount: 17, perRow: 4, rowCount: 2, rowMax: 3 }))
      .toEqual({
        visibleCount: 8,
        openRows: 2,
        showLess: true,
        showMore: true,
      });
  });
});
