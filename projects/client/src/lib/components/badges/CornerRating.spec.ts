import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import CornerRating from './CornerRating.svelte';

describe('component: CornerRating', () => {
  it('should show the rating in a corner coloured by it', () => {
    const { container } = render(CornerRating, {
      props: { rating: 7, label: 'Your rating: 7' },
    });

    expect(screen.getByText('7')).toBeVisible();
    expect(container.querySelector('.trakt-corner-rating'))
      .toHaveAttribute('data-rating', '7');
  });

  it('should name the corner by its label, not by the bare number', () => {
    render(CornerRating, { props: { rating: 8, label: 'Your rating: 8' } });

    expect(screen.getByRole('img', { name: 'Your rating: 8' }))
      .toHaveAttribute('title', 'Your rating: 8');
    expect(screen.getByText('8')).toHaveAttribute('aria-hidden', 'true');
  });

  it('should render nothing without a rating', () => {
    const { container } = render(CornerRating, {
      props: { rating: null, label: 'Your rating' },
    });

    expect(container.children).toHaveLength(0);
  });
});
