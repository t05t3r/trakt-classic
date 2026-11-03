import { describe, expect, it } from 'vitest';
import { type PaginationSlot, paginationWindow } from './paginationWindow.ts';

function toText(slots: ReadonlyArray<PaginationSlot>): string {
  return slots
    .map((slot) => slot.kind === 'page' ? String(slot.page) : '…')
    .join(' ');
}

describe('util: paginationWindow', () => {
  describe('for 13 pages', () => {
    it.each([
      { current: 1, shown: '1 2 3 4 5 … 12 13' },
      { current: 4, shown: '1 2 3 4 5 6 … 12 13' },
      { current: 6, shown: '1 2 3 4 5 6 7 8 … 12 13' },
      { current: 7, shown: '1 2 … 5 6 7 8 9 … 12 13' },
      { current: 13, shown: '1 2 … 9 10 11 12 13' },
    ])('should show $shown on page $current', ({ current, shown }) => {
      const { slots } = paginationWindow({ current, count: 13 });

      expect(toText(slots)).toBe(shown);
    });
  });

  describe('for 8 pages or fewer', () => {
    it.each([
      { current: 1, count: 8, shown: '1 2 3 4 5 6 7 8' },
      { current: 4, count: 8, shown: '1 2 3 4 5 6 7 8' },
      { current: 8, count: 8, shown: '1 2 3 4 5 6 7 8' },
      { current: 2, count: 3, shown: '1 2 3' },
      { current: 1, count: 1, shown: '1' },
    ])(
      'should show every page, with no gap, on page $current of $count',
      ({ current, count, shown }) => {
        const { slots } = paginationWindow({ current, count });

        expect(toText(slots)).toBe(shown);
      },
    );
  });

  it('should open a gap from 9 pages', () => {
    const { slots } = paginationWindow({ current: 1, count: 9 });

    expect(toText(slots)).toBe('1 2 3 4 5 … 8 9');
  });

  it('should return the current page it was given inside the count', () => {
    expect(paginationWindow({ current: 7, count: 13 }).current).toBe(7);
  });

  it('should clamp a current page past the count to the last page', () => {
    const { current, slots } = paginationWindow({ current: 20, count: 13 });

    expect(current).toBe(13);
    expect(toText(slots)).toBe('1 2 … 9 10 11 12 13');
  });

  it('should clamp a current page below 1 to the first page', () => {
    const { current, slots } = paginationWindow({ current: 0, count: 13 });

    expect(current).toBe(1);
    expect(toText(slots)).toBe('1 2 3 4 5 … 12 13');
  });

  it('should key every slot uniquely, both gaps included', () => {
    const { slots } = paginationWindow({ current: 7, count: 13 });

    const keys = slots.map((slot) => slot.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
