import { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';
import type { ListItem } from '$lib/requests/models/ListItem.ts';
import type { UpNextEntry } from '$lib/requests/models/UpNextEntry.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { UpNextMappedMock } from '$mocks/data/sync/mapped/UpNextMappedMock.ts';
import { itemOfType } from '$test/beds/dashboard/itemOfType.ts';
import { describe, expect, it } from 'vitest';
import { toHeroPosters } from './toHeroPosters.ts';

const UP_NEXT = assertDefined(UpNextMappedMock.at(0));
const MOVIE = itemOfType('movie');
const EPISODE = itemOfType('episode');

function poster(thumb: string) {
  return { url: { thumb, medium: thumb, full: thumb } };
}

function upNext(thumb: string): UpNextEntry {
  return { ...UP_NEXT, show: { ...UP_NEXT.show, poster: poster(thumb) } };
}

function watchlisted(thumb: string): ListItem {
  return { ...MOVIE, entry: { ...MOVIE.entry, poster: poster(thumb) } };
}

function thumbs(prefix: string, count: number) {
  return Array.from({ length: count }, (_, index) => `/${prefix}-${index}.jpg`);
}

describe('util: toHeroPosters', () => {
  it("should give Up Next's posters, then the Watchlist's in rank order", () => {
    const posters = toHeroPosters({
      upNext: [upNext('/u-1.jpg'), upNext('/u-2.jpg')],
      watchlist: [watchlisted('/w-1.jpg'), watchlisted('/w-2.jpg')],
    });

    expect(posters).toEqual(['/u-1.jpg', '/u-2.jpg', '/w-1.jpg', '/w-2.jpg']);
  });

  it("should take Up Next's first 12 posters, however short the Watchlist", () => {
    const posters = toHeroPosters({
      upNext: thumbs('u', 16).map(upNext),
      watchlist: [watchlisted('/w-1.jpg')],
    });

    expect(posters).toEqual([...thumbs('u', 12), '/w-1.jpg']);
  });

  it('should fill the rest from the Watchlist up to 24 posters', () => {
    const posters = toHeroPosters({
      upNext: thumbs('u', 3).map(upNext),
      watchlist: thumbs('w', 30).map(watchlisted),
    });

    expect(posters).toEqual([...thumbs('u', 3), ...thumbs('w', 21)]);
  });

  it('should skip the placeholders of both lists', () => {
    const posters = toHeroPosters({
      upNext: [upNext(PLACEHOLDERS.poster), upNext('/u-1.jpg')],
      watchlist: [watchlisted(PLACEHOLDERS.poster), watchlisted('/w-1.jpg')],
    });

    expect(posters).toEqual(['/u-1.jpg', '/w-1.jpg']);
  });

  it('should skip a Watchlist poster Up Next already gives', () => {
    const showPoster =
      '/img/shows/000/154/574/posters/thumb/5fea83a517.jpg.webp';

    const posters = toHeroPosters({
      upNext: [upNext(showPoster)],
      watchlist: [EPISODE, watchlisted('/w-1.jpg'), watchlisted('/w-1.jpg')],
    });

    expect(posters).toEqual([showPoster, '/w-1.jpg']);
  });

  it('should give no posters while both lists are empty', () => {
    expect(toHeroPosters({ upNext: [], watchlist: [] })).toEqual([]);
  });
});
