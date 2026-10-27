import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import EpisodeTypeRibbon from './EpisodeTypeRibbon.svelte';

describe('component: EpisodeTypeRibbon', () => {
  it('should name a premiere', () => {
    render(EpisodeTypeRibbon, { props: { type: 'mid_season_premiere' } });

    expect(screen.getByText('Mid-Season Premiere')).toBeVisible();
  });

  it('should carry the episode type for its colour', () => {
    render(EpisodeTypeRibbon, { props: { type: 'season_finale' } });

    expect(screen.getByText('Season Finale'))
      .toHaveAttribute('data-type', 'season_finale');
  });

  it('should render nothing for a standard episode', () => {
    const { container } = render(EpisodeTypeRibbon, {
      props: { type: 'standard' },
    });

    expect(container.children).toHaveLength(0);
  });
});
