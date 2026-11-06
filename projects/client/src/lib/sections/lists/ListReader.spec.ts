import { useQuery } from '$lib/features/query/useQuery.ts';
import { movieSummaryQuery } from '$lib/requests/queries/movies/movieSummaryQuery.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import ListReaderHost from '$test/beds/lists/ListReaderHost.svelte';
import { render, screen } from '@testing-library/svelte';
import { BehaviorSubject, map, of } from 'rxjs';
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

const readingOf = () => screen.getByRole('status');

describe('ListReader', () => {
  it('should hand up what it reads at init, reading once', () => {
    const read = vi.fn((key: string) => of(`Reading ${key}`));
    render(ListReaderHost, { props: { read } });

    expect(readingOf()).toHaveTextContent('Reading a');
    expect(read.mock.calls).toEqual([['a']]);
  });

  it('should read again on a key change, and drop the reading before it', async () => {
    const streams = new Map<string, BehaviorSubject<string>>();
    const read = (key: string) => {
      const stream = new BehaviorSubject(`Reading ${key}`);
      streams.set(key, stream);
      return stream;
    };
    render(ListReaderHost, { props: { read } });

    screen.getByRole('button', { name: 'Rekey' }).click();
    await tick();
    streams.get('a')?.next('Late a');
    await tick();

    expect(readingOf()).toHaveTextContent('Reading b');
    expect(streams.get('a')?.observed).toBe(false);
  });

  it('should keep the state and the focus outside the key across a key change', async () => {
    render(ListReaderHost, { props: { read: (key) => of(key) } });
    const outside = screen.getByRole('button', { name: 'Closed' });
    outside.click();
    await tick();
    outside.focus();

    screen.getByRole('button', { name: 'Rekey' }).click();
    await tick();

    expect(readingOf()).toHaveTextContent('b');
    expect(outside).toHaveTextContent('Open');
    expect(outside).toHaveFocus();
  });

  it('should read a query hook, which takes the query client from the context', async () => {
    renderComponent(ListReaderHost, {
      props: {
        read: () =>
          useQuery(movieSummaryQuery({ slug: MovieHereticMappedMock.slug }))
            .pipe(map((query) => query.data?.title ?? '')),
      },
    });

    expect(await screen.findByText(MovieHereticMappedMock.title))
      .toBeInTheDocument();
  });
});
