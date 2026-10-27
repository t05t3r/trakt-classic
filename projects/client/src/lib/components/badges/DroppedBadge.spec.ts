import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import DroppedBadge from './DroppedBadge.svelte';

describe('component: DroppedBadge', () => {
  it('should name the drop date as an image with a matching tooltip', () => {
    render(DroppedBadge, {
      props: { droppedAt: new Date(2026, 2, 4, 21, 5) },
    });

    const badge = screen.getByRole('img', {
      name: 'Dropped on 4 Mar 2026 21:05',
    });
    expect(badge).toHaveAttribute('title', 'Dropped on 4 Mar 2026 21:05');
  });
});
