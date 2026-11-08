import type { SortBy } from '$lib/models/SortBy.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { itemOfType } from '$test/beds/dashboard/itemOfType.ts';
import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { emulateHydrated } from '$test/beds/hydration/emulateHydrated.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { formatSortValue } from '../formatSortValue.ts';
import type { ListEntry } from '../ListEntry.ts';
import SortValue from './SortValue.svelte';

const MOVIE = itemOfType('movie');
const SHOW = itemOfType('show');

function renderValue(item: ListEntry, sortBy: SortBy) {
  return renderComponent(SortValue, {
    props: { value: formatSortValue({ item, sortBy }) },
  });
}

describe('SortValue', () => {
  it("should render a movie's release day before the app hydrates", () => {
    const { container } = renderValue(MOVIE, 'released');

    expect(container).toHaveTextContent('4 Mar 2022');
  });

  it("should render the viewer's date and time an item was added only once the app hydrates", async () => {
    setTimeZone('Asia/Tokyo');
    renderValue(MOVIE, 'added');
    await waitNegativeClaim();

    expect(screen.queryByText('11 Aug 2025 11:34')).toBeNull();

    emulateHydrated();

    expect(await screen.findByText('11 Aug 2025 11:34')).toBeInTheDocument();
  });

  it("should render a show's release as the viewer's day without its time", async () => {
    setTimeZone('America/Los_Angeles');
    const { container } = renderValue(SHOW, 'released');

    emulateHydrated();

    expect(await screen.findByText('31 Mar 2022')).toBeInTheDocument();
    expect(container).toHaveTextContent(/^31 Mar 2022$/);
  });

  it('should render a runtime as hours and minutes', () => {
    renderValue(MOVIE, 'runtime');

    expect(screen.getByText('2h 57m')).toBeInTheDocument();
  });

  it('should render a text value as it reads', () => {
    renderValue(MOVIE, 'percentage');

    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it.each(['released', 'runtime'] as const)(
    'should render a %s value as static text',
    (sortBy) => {
      renderValue(MOVIE, sortBy);

      expect(screen.queryByRole('button')).toBeNull();
    },
  );

  it('should render nothing without a value', () => {
    const { container } = renderComponent(SortValue, {
      props: { value: undefined },
    });

    expect(container.textContent?.trim()).toBe('');
  });
});
