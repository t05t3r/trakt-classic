import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import { describe, expect, it } from 'vitest';
import { toClientPage } from './toClientPage.ts';

const IDS = [1, 2, 3, 4, 5];

function toRow(id: number) {
  return {
    entry: id,
    card: {
      target: {
        type: 'movie' as const,
        id,
        title: `Movie ${id}`,
        airDate: null,
      },
    },
    isFaded: false,
  };
}

function toCover(id: number) {
  return `/covers/${id}.jpg`;
}

function readPage(
  { status, page, pageSize = 2 }: {
    status: SectionStatus<ReadonlyArray<number>>;
    page: number;
    pageSize?: number;
  },
) {
  return toClientPage({ status, page, pageSize, toRow, toCover });
}

const READY = { kind: 'ready', data: IDS } as const;

describe('toClientPage', () => {
  it('should read every entry on one page when they fit', () => {
    expect(readPage({ status: READY, page: 1, pageSize: 50 })).toEqual({
      status: { kind: 'ready', data: IDS.map(toRow) },
      pages: { current: 1, total: 1 },
      itemCount: 5,
      cover: '/covers/1.jpg',
      entries: IDS,
    });
  });

  it("should read a page's slice, with the cover of its first entry", () => {
    expect(readPage({ status: READY, page: 2 })).toEqual({
      status: { kind: 'ready', data: [toRow(3), toRow(4)] },
      pages: { current: 2, total: 3 },
      itemCount: 5,
      cover: '/covers/3.jpg',
      entries: [3, 4],
    });
  });

  it('should read a partial last page', () => {
    expect(readPage({ status: READY, page: 3 })).toEqual({
      status: { kind: 'ready', data: [toRow(5)] },
      pages: { current: 3, total: 3 },
      itemCount: 5,
      cover: '/covers/5.jpg',
      entries: [5],
    });
  });

  it('should read the cover of a falsy first entry', () => {
    expect(readPage({ status: { kind: 'ready', data: [0] }, page: 1 }).cover)
      .toBe('/covers/0.jpg');
  });

  it('should read no entries as one empty page', () => {
    expect(readPage({ status: { kind: 'empty' }, page: 1 })).toEqual({
      status: { kind: 'empty' },
      pages: { current: 1, total: 1 },
      itemCount: 0,
      cover: undefined,
      entries: [],
    });
  });

  it('should read a page past the last as loading, with the counts', () => {
    expect(readPage({ status: READY, page: 4 })).toEqual({
      status: { kind: 'loading' },
      pages: { current: 4, total: 3 },
      itemCount: 5,
      cover: undefined,
      entries: [],
    });
  });

  it.each(
    [
      { kind: 'loading' },
      { kind: 'error', retry: () => undefined },
    ] as const,
  )('should pass a $kind status through, with no counts', (status) => {
    expect(readPage({ status, page: 2 })).toEqual({
      status,
      pages: { current: 2, total: undefined },
      itemCount: undefined,
      cover: undefined,
      entries: undefined,
    });
  });
});
