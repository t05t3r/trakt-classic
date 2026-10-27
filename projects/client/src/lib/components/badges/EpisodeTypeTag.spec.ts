import type { EpisodeType } from '$lib/requests/models/EpisodeType.ts';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import EpisodeTypeTag from './EpisodeTypeTag.svelte';

describe('component: EpisodeTypeTag', () => {
  it.each<[EpisodeType, string]>([
    ['series_premiere', 'Series Premiere'],
    ['season_premiere', 'Season Premiere'],
    ['mid_season_premiere', 'Mid-Season Premiere'],
    ['mid_season_finale', 'Mid-Season Finale'],
    ['season_finale', 'Season Finale'],
    ['series_finale', 'Series Finale'],
  ])('should name a %s and carry its type for the colour', (type, text) => {
    render(EpisodeTypeTag, { props: { type } });

    const tag = screen.getByText(text);
    expect(tag.tagName).toBe('SPAN');
    expect(tag).toHaveAttribute('data-type', type);
  });

  it.each<EpisodeType>(['full_season', 'standard'])(
    'should render nothing for a %s line',
    (type) => {
      const { container } = render(EpisodeTypeTag, { props: { type } });

      expect(container.children).toHaveLength(0);
    },
  );
});
