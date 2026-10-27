import type { CreateQueryOptions } from '$lib/features/query/QueryOptions.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import type { JsonBodyType } from 'msw';
import { describe, expect, it } from 'vitest';

type DescribePeopleQueryProps<T> = {
  name: string;
  subject: string;
  query: () => CreateQueryOptions<T, Error>;
  url: string;
  response: JsonBodyType;
  mapped: T;
};

export function describePeopleQuery<T>({
  name,
  subject,
  query,
  url,
  response,
  mapped,
}: DescribePeopleQueryProps<T>) {
  const readPeople = () =>
    runQuery({
      factory: () => createTestBedQuery(query()),
      mapper: (result) => result?.data,
    });

  describe(name, () => {
    it(`should query people for ${subject}`, async () => {
      const result = await readPeople();

      expect(result).toEqual(mapped);
    });

    it('should ask for the images and the guest stars', async () => {
      const searches = recordSearches(url, response);

      await readPeople();

      expect(searches.map((search) => search.get('extended'))).toEqual([
        'images,guest_stars',
      ]);
    });
  });
}
