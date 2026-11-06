import type { InfiniteQuery } from '$lib/features/query/models/InfiniteQuery.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { describe, expect, it } from 'vitest';

type PlayRow = { id: number };

type DescribeMalformedPlayQueryProps<E extends PlayRow> = {
  name: string;
  query: () => InfiniteQuery<E>;
  url: string;
  response: ReadonlyArray<PlayRow>;
};

export function describeMalformedPlayQuery<E extends PlayRow>(
  { name, query, url, response }: DescribeMalformedPlayQueryProps<E>,
) {
  describe(name, () => {
    it.each(['soon', null])(
      'should drop a play whose watched_at is %j, keeping the rest',
      async (watchedAt) => {
        const malformed = response.map((row) => ({
          ...row,
          id: row.id + 1000,
          watched_at: watchedAt,
        }));
        servePaged({ url, body: [...response, ...malformed] });

        const entries = await runQuery({
          factory: () => createTestBedInfiniteQuery(query()),
          mapper: mapToEntries,
        });

        expect(entries).toEqual(
          response.map(({ id }) => expect.objectContaining({ id })),
        );
      },
    );
  });
}
