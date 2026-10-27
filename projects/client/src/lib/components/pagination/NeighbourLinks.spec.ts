import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import NeighbourLinks from './NeighbourLinks.svelte';

const LABELS = {
  previousLabel: 'Previous season',
  nextLabel: 'Next season',
};

describe('component: NeighbourLinks', () => {
  it('should link the previous neighbour under its label, as the previous page', () => {
    render(NeighbourLinks, {
      props: { ...LABELS, previous: '/shows/silo/seasons/1' },
    });

    const link = screen.getByRole('link', { name: 'Previous season' });
    expect(link).toHaveAttribute('href', '/shows/silo/seasons/1');
    expect(link).toHaveAttribute('rel', 'prev');
  });

  it('should link the next neighbour under its label, as the next page', () => {
    render(NeighbourLinks, {
      props: { ...LABELS, next: '/shows/silo/seasons/3' },
    });

    const link = screen.getByRole('link', { name: 'Next season' });
    expect(link).toHaveAttribute('href', '/shows/silo/seasons/3');
    expect(link).toHaveAttribute('rel', 'next');
  });

  it('should link only the neighbour it is given', () => {
    render(NeighbourLinks, {
      props: { ...LABELS, next: '/shows/silo/seasons/3' },
    });

    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('should render nothing without either neighbour', () => {
    const { container } = render(NeighbourLinks, { props: LABELS });

    expect(container.children).toHaveLength(0);
  });

  it('should mark its chevrons as directional and hide them from assistive technology', () => {
    const { container } = render(NeighbourLinks, {
      props: {
        ...LABELS,
        previous: '/shows/silo/seasons/1',
        next: '/shows/silo/seasons/3',
      },
    });

    const [previous, next] = container.querySelectorAll('svg');
    expect(previous).toHaveClass('tabler-icon-chevron-left');
    expect(next).toHaveClass('tabler-icon-chevron-right');
    [previous, next].forEach((chevron) => {
      expect(chevron).toHaveClass('trakt-icon-directional');
      expect(chevron).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
