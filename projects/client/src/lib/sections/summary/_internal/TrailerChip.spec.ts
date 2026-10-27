import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import TrailerChip from './TrailerChip.svelte';

const TRAILER = 'https://youtube.com/watch?v=jpWUOxRozZg';

describe('TrailerChip', () => {
  it('should open the trailer in a new tab under the Videos title', () => {
    render(TrailerChip, { props: { trailer: TRAILER } });

    const link = screen.getByRole('link', { name: 'Trailer' });

    expect(screen.getByText('Videos')).toBeInTheDocument();
    expect(link).toHaveAttribute('href', TRAILER);
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('should render nothing without a trailer', () => {
    const { container } = render(TrailerChip, { props: { trailer: null } });

    expect(container.querySelector('.trakt-trailer-chip')).toBeNull();
    expect(screen.queryByText('Videos')).toBeNull();
  });
});
