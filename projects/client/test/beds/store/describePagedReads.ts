import type {
  PagedCard,
  PagedReading,
} from '$lib/features/paging/stores/usePagedItems.ts';
import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import { FIRST_PAGE } from '$lib/utils/FIRST_PAGE.ts';
import { kindsOf } from '$test/beds/query/kindsOf.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { failOnce } from '$test/beds/request/failOnce.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { readingOf } from '$test/beds/store/readingOf.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { statusOf } from '$test/beds/store/statusOf.ts';
import { waitFor } from '@testing-library/svelte';
import type { Observable } from 'rxjs';
import { describe, expect, it } from 'vitest';

type PagedItems<E, C extends PagedCard> = {
  store: () => { reading: Observable<PagedReading<E, C>> };
  replacePage: (page: number) => void;
};

type DescribePagedReadsProps<E, C extends PagedCard> = {
  url: string;
  items: (page: number) => PagedItems<E, C>;
  cover: ImageUrl;
};

export function describePagedReads<E, C extends PagedCard>(
  { url, items, cover }: DescribePagedReadsProps<E, C>,
) {
  const readPage = async (page: number = FIRST_PAGE) => {
    const { store, replacePage } = items(page);
    const { reading } = await renderStore(store);

    return { reading, replacePage };
  };

  describe('paged reads', () => {
    it('should read a page with no entries as empty', async () => {
      servePaged({ url, body: [] });
      const { reading } = await readPage();

      expect(await nextOf(statusOf(reading), 'empty')).toEqual({
        kind: 'empty',
      });
    });

    it('should read a failed read as error, and land the page on Retry', async () => {
      failOnce(url);
      const { reading } = await readPage();
      const kinds = kindsOf(statusOf(reading));

      const failed = await nextOf(statusOf(reading), 'error');
      failed.retry();
      await nextOf(statusOf(reading), 'ready');

      expect(kinds).toEqual(['loading', 'error', 'loading', 'ready']);
    });

    it('should read the item and page counts from the page headers', async () => {
      servePaged({ url, body: [], pageCount: 3, itemCount: 150 });
      const { reading } = await readPage();

      expect(await readingOf(reading, 'itemCount')).toBe(150);
      expect(await readingOf(reading, 'pages')).toEqual({
        current: 1,
        total: 3,
      });
    });

    it('should replace a page past the last with the last page, reading loading until then', async () => {
      servePaged({ url, body: [], page: 5, pageCount: 2, itemCount: 100 });
      const { reading, replacePage } = await readPage(5);
      const kinds = kindsOf(statusOf(reading));

      await waitFor(() => expect(replacePage).toHaveBeenCalledWith(2));

      expect(kinds).toEqual(['loading']);
    });

    it("should take the cover from the page's first entry", async () => {
      const { reading } = await readPage();

      expect(await readingOf(reading, 'cover')).toBe(cover);
    });
  });
}
