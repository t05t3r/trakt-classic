import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import RatingLine from './RatingLine.svelte';

function renderLine(rating: number, label: string) {
  const { container } = render(RatingLine, { props: { rating, label } });

  return container.querySelector('.trakt-rating-line');
}

describe('component: RatingLine', () => {
  it.each(
    [
      { rating: 1, label: 'Weak Sauce :(' },
      { rating: 10, label: 'Totally Ninja!' },
    ] as const,
  )(
    'should read $rating in bold, a dash and its label, its heart coloured by the rating',
    ({ rating, label }) => {
      const line = renderLine(rating, label);

      expect(line).toHaveTextContent(`${rating} — ${label}`);
      expect(line).toHaveAttribute('data-rating', String(rating));
      expect(screen.getByText(String(rating)).tagName).toBe('B');
    },
  );

  it('should hide the heart from a screen reader', () => {
    const line = renderLine(6, 'Fair');

    expect(line?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('should clip its own overflow', () => {
    const line = renderLine(6, 'Fair');

    expect(line).toHaveClass('ellipsis');
  });

  it('should bring no heading of its own, since the card supplies one', () => {
    renderLine(6, 'Fair');

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
