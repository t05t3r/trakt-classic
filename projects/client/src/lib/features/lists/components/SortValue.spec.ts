import { HERETIC } from '$mocks/data/media-actions/HERETIC.ts';
import { FavoritedMoviesMappedMock } from '$mocks/data/users/mapped/FavoritedMoviesMappedMock.ts';
import { toListItemCard } from '$lib/features/media-card/toListItemCard.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { itemOfType } from '$test/beds/dashboard/itemOfType.ts';
import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { emulateHydrated } from '$test/beds/hydration/emulateHydrated.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import SortValue from './SortValue.svelte';

const MOVIE = itemOfType('movie');
const MOVIE_TARGET = toListItemCard(MOVIE).target;
const SHOW = itemOfType('show');
const SHOW_TARGET = toListItemCard(SHOW).target;
const FAVOURITE = assertDefined(FavoritedMoviesMappedMock.at(0));

describe('SortValue', () => {
  it("should render a movie's release day before the app hydrates", () => {
    const { container } = renderComponent(SortValue, {
      props: { item: MOVIE, sortBy: 'released', target: MOVIE_TARGET },
    });

    expect(container).toHaveTextContent('4 Mar 2022');
  });

  it("should render the viewer's date and time an item was added only once the app hydrates", async () => {
    setTimeZone('Asia/Tokyo');
    renderComponent(SortValue, {
      props: { item: MOVIE, sortBy: 'added', target: MOVIE_TARGET },
    });
    await waitNegativeClaim();

    expect(screen.queryByText('11 Aug 2025 11:34')).toBeNull();

    emulateHydrated();

    expect(await screen.findByText('11 Aug 2025 11:34')).toBeInTheDocument();
  });

  it("should render a show's release as the viewer's day without its time", async () => {
    setTimeZone('America/Los_Angeles');
    const { container } = renderComponent(SortValue, {
      props: { item: SHOW, sortBy: 'released', target: SHOW_TARGET },
    });

    emulateHydrated();

    expect(await screen.findByText('31 Mar 2022')).toBeInTheDocument();
    expect(container).toHaveTextContent(/^31 Mar 2022$/);
  });

  it('should render a runtime as hours and minutes', () => {
    renderComponent(SortValue, {
      props: { item: MOVIE, sortBy: 'runtime', target: MOVIE_TARGET },
    });

    expect(screen.getByText('2h 57m')).toBeInTheDocument();
  });

  it('should render a text value as it reads', () => {
    renderComponent(SortValue, {
      props: { item: MOVIE, sortBy: 'percentage', target: MOVIE_TARGET },
    });

    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it.each(['released', 'runtime'] as const)(
    'should render a %s value as static text',
    (sortBy) => {
      renderComponent(SortValue, {
        props: { item: MOVIE, sortBy, target: MOVIE_TARGET },
      });

      expect(screen.queryByRole('button')).toBeNull();
    },
  );

  it("should render the viewer's rating under my_rating", async () => {
    renderComponent(SortValue, {
      props: { item: FAVOURITE, sortBy: 'my_rating', target: HERETIC },
    });

    expect(await screen.findByText('10')).toBeInTheDocument();
  });

  it('should render nothing under my_rating for an item the viewer has not rated', async () => {
    const { container, userLoaded } = renderComponent(SortValue, {
      props: { item: MOVIE, sortBy: 'my_rating', target: MOVIE_TARGET },
    });
    await userLoaded;
    await waitNegativeClaim();

    expect(container.textContent?.trim()).toBe('');
  });
});
