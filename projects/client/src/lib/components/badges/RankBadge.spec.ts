import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import RankBadge from './RankBadge.svelte';

describe('component: RankBadge', () => {
  it('should show the rank it is given in the pill', () => {
    const { container } = render(RankBadge, { props: { rank: 4 } });

    expect(screen.getByText('4')).toBeVisible();
    expect(container.querySelector('.trakt-rank-badge'))
      .toHaveTextContent(/^4$/);
  });

  it('should show a rank of three digits whole', () => {
    render(RankBadge, { props: { rank: 138 } });

    expect(screen.getByText('138')).toBeVisible();
  });
});
