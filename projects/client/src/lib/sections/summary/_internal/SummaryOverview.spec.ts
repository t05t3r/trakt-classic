import { OVERVIEW_PLACEHOLDER } from '$lib/requests/OVERVIEW_PLACEHOLDER.ts';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import SummaryOverview from './SummaryOverview.svelte';

const OVERVIEW = 'Two young missionaries are forced to prove their faith.';
const TRAILER = 'https://youtube.com/watch?v=jpWUOxRozZg';
const ROWS = [{
  key: 'genres',
  label: 'Genres',
  values: [{ key: 'horror', text: 'Horror' }],
}];

function follows(first: Element, second: Element) {
  return Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
}

describe('SummaryOverview', () => {
  it('should show the tagline above the overview', () => {
    render(SummaryOverview, {
      props: { tagline: 'Believe in something.', overview: OVERVIEW },
    });

    const tagline = screen.getByText('Believe in something.');
    const overview = screen.getByText(OVERVIEW);

    expect(follows(tagline, overview)).toBe(true);
  });

  it('should leave out an empty tagline', () => {
    const { container } = render(SummaryOverview, {
      props: { tagline: '', overview: OVERVIEW },
    });

    expect(container.querySelector('.overview-tagline')).toBeNull();
  });

  it('should leave out the overview placeholder', () => {
    const { container } = render(SummaryOverview, {
      props: { overview: OVERVIEW_PLACEHOLDER },
    });

    expect(screen.queryByText(OVERVIEW_PLACEHOLDER)).toBeNull();
    expect(container.querySelector('.trakt-clamped-text')).toBeNull();
  });

  it('should leave out an empty overview', () => {
    const { container } = render(SummaryOverview, {
      props: { overview: '' },
    });

    expect(container.querySelector('.trakt-clamped-text')).toBeNull();
  });

  it('should set the stats rows first and the trailer last', () => {
    render(SummaryOverview, {
      props: {
        rows: ROWS,
        tagline: 'Believe in something.',
        overview: OVERVIEW,
        trailer: TRAILER,
      },
    });

    const rows = screen.getByText('Genres');
    const tagline = screen.getByText('Believe in something.');
    const overview = screen.getByText(OVERVIEW);
    const trailer = screen.getByRole('link', { name: 'Trailer' });

    expect(follows(rows, tagline)).toBe(true);
    expect(follows(tagline, overview)).toBe(true);
    expect(follows(overview, trailer)).toBe(true);
  });

  it('should leave out the trailer when there is none', () => {
    render(SummaryOverview, { props: { overview: OVERVIEW, trailer: null } });

    expect(screen.queryByRole('link', { name: 'Trailer' })).toBeNull();
  });
});
