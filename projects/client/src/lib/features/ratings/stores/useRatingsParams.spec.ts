import type { RatingFilter } from '$lib/features/media-actions/RATING_VALUES.ts';
import type { RatingsTypeFilter } from '$lib/features/ratings/RATINGS_TYPES.ts';
import { RATINGS_PATH } from '$mocks/data/users/RATINGS_PATH.ts';
import { collectStates } from '$test/beds/store/collectStates.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { valueObservable } from '$test/beds/store/valueObservable.ts';
import { expectOneReplace } from '$test/beds/url/expectOneReplace.ts';
import { lastPush } from '$test/beds/url/lastPush.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { BehaviorSubject, firstValueFrom, type Observable } from 'rxjs';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { useRatingsParams } from './useRatingsParams.ts';

function renderParams(filters = '') {
  return renderStore(() => useRatingsParams(valueObservable(filters)));
}

describe('store: useRatingsParams', () => {
  describe('type and rating', () => {
    it('should type both slots as their filters', () => {
      expectTypeOf(useRatingsParams).returns.toHaveProperty('type')
        .toEqualTypeOf<Observable<RatingsTypeFilter>>();
      expectTypeOf(useRatingsParams).returns.toHaveProperty('rating')
        .toEqualTypeOf<Observable<RatingFilter>>();
    });

    it.each([
      { filters: '', type: 'all', rating: 'all' },
      { filters: 'movies/all', type: 'movies', rating: 'all' },
      { filters: 'all/8', type: 'all', rating: '8' },
      { filters: 'all/added', type: 'all', rating: 'all' },
      { filters: 'seasons/10/added/asc', type: 'seasons', rating: '10' },
      { filters: 'films/11', type: 'all', rating: 'all' },
    ])(
      'should read "$filters" as $type and $rating',
      async ({ filters, type, rating }) => {
        openAt(RATINGS_PATH);
        const params = await renderParams(filters);

        expect(await readKnown(params.type)).toBe(type);
        expect(await readKnown(params.rating)).toBe(rating);
      },
    );

    it('should follow the route while the store lives', async () => {
      openAt(RATINGS_PATH);
      const filters = new BehaviorSubject('movies');
      const params = await renderStore(() => useRatingsParams(filters));
      const types = collectStates(params.type);
      const ratings = collectStates(params.rating);

      filters.next('movies/8');
      filters.next('shows/8');
      filters.next('shows/8/added');
      filters.next('');

      expect(types).toEqual(['movies', 'shows', 'all']);
      expect(ratings).toEqual(['all', '8', 'all']);
    });
  });

  describe('setType', () => {
    it('should keep the current rating, drop the page and keep the rest', async () => {
      openAt(`${RATINGS_PATH}/all/8?hide=watched&page=4`);
      const { setType } = await renderParams('all/8');

      await setType('movies');

      expect(lastPush()).toBe(`${RATINGS_PATH}/movies/8?hide=watched`);
    });

    it('should write all in the rating slot when no rating is set', async () => {
      openAt(RATINGS_PATH);
      const { setType } = await renderParams();

      await setType('shows');

      expect(lastPush()).toBe(`${RATINGS_PATH}/shows/all`);
    });

    it('should push the bare path for all with no rating set', async () => {
      openAt(`${RATINGS_PATH}/shows/all?page=2&fade=watched`);
      const { setType } = await renderParams('shows/all');

      await setType('all');

      expect(lastPush()).toBe(`${RATINGS_PATH}?fade=watched`);
    });

    it('should read the rating the route holds at the call', async () => {
      openAt(RATINGS_PATH);
      const filters = new BehaviorSubject('all/8');
      const { setType } = await renderStore(() => useRatingsParams(filters));

      filters.next('all/3');
      await setType('episodes');

      expect(lastPush()).toBe(`${RATINGS_PATH}/episodes/3`);
    });
  });

  describe('setRating', () => {
    it('should keep the current type, drop the page and keep the rest', async () => {
      openAt(`${RATINGS_PATH}/movies/all?fade=watched&page=4`);
      const { setRating } = await renderParams('movies/all');

      await setRating('8');

      expect(lastPush()).toBe(`${RATINGS_PATH}/movies/8?fade=watched`);
    });

    it('should write all in the type slot when no type is set', async () => {
      openAt(RATINGS_PATH);
      const { setRating } = await renderParams();

      await setRating('10');

      expect(lastPush()).toBe(`${RATINGS_PATH}/all/10`);
    });

    it('should push the bare path for all with no type set', async () => {
      openAt(`${RATINGS_PATH}/all/8?page=2`);
      const { setRating } = await renderParams('all/8');

      await setRating('all');

      expect(lastPush()).toBe(RATINGS_PATH);
    });

    it('should read the type the route holds at the call', async () => {
      openAt(RATINGS_PATH);
      const filters = new BehaviorSubject('movies');
      const { setRating } = await renderStore(() => useRatingsParams(filters));

      filters.next('shows/8');
      await setRating('2');

      expect(lastPush()).toBe(`${RATINGS_PATH}/shows/2`);
    });
  });

  describe('watched', () => {
    it('should read ?hide=watched as hide', async () => {
      openAt(`${RATINGS_PATH}?hide=watched`);
      const params = await renderParams();

      expect(await firstValueFrom(params.watched)).toBe('hide');
    });

    it('should replace the filter and keep the page', async () => {
      openAt(`${RATINGS_PATH}/movies/8?page=3&fade=watched`);
      const { setWatched } = await renderParams('movies/8');

      await setWatched('hide');

      expectOneReplace();
      expect(lastReplace()).toBe(
        `${RATINGS_PATH}/movies/8?page=3&hide=watched`,
      );
    });
  });

  describe('page', () => {
    it('should read ?page=4 as page 4', async () => {
      openAt(`${RATINGS_PATH}?page=4`);
      const params = await renderParams();

      expect(await readKnown(params.page)).toBe(4);
    });

    it('should replace the page and keep the rest', async () => {
      openAt(`${RATINGS_PATH}/all/8?hide=watched&page=4`);
      const { replacePage } = await renderParams('all/8');

      await replacePage(2);

      expectOneReplace();
      expect(lastReplace()).toBe(`${RATINGS_PATH}/all/8?hide=watched&page=2`);
    });
  });
});
