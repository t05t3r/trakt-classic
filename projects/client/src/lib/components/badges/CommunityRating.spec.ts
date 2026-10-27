import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import CommunityRating from './CommunityRating.svelte';

const RELEASED = new Date('2020-05-01T00:00:00Z');
const UNRELEASED = new Date('2999-05-01T00:00:00Z');

describe('component: CommunityRating', () => {
  it('should show the percentage beside a heart in its band', () => {
    const { container } = render(CommunityRating, {
      props: {
        rating: 0.74,
        earliestReleaseDate: RELEASED,
        displayEarlyRatings: false,
      },
    });

    expect(screen.getByText('74%')).toBeVisible();
    expect(container.querySelector('svg'))
      .toHaveAttribute('data-rating', '7');
    expect(container.querySelector('.trakt-community-rating'))
      .toHaveAttribute('data-variant', 'default');
  });

  it('should show a rating of 0 beside a heart in band 0', () => {
    const { container } = render(CommunityRating, {
      props: {
        rating: 0,
        earliestReleaseDate: RELEASED,
        displayEarlyRatings: false,
      },
    });

    expect(screen.getByText('0%')).toBeVisible();
    expect(container.querySelector('svg'))
      .toHaveAttribute('data-rating', '0');
  });

  it('should carry the smaller variant', () => {
    const { container } = render(CommunityRating, {
      props: {
        rating: 0.74,
        earliestReleaseDate: RELEASED,
        displayEarlyRatings: false,
        variant: 'smaller',
      },
    });

    expect(container.querySelector('.trakt-community-rating'))
      .toHaveAttribute('data-variant', 'smaller');
  });

  it('should carry the summary variant', () => {
    const { container } = render(CommunityRating, {
      props: {
        rating: 0.74,
        earliestReleaseDate: RELEASED,
        displayEarlyRatings: false,
        variant: 'summary',
      },
    });

    expect(container.querySelector('.trakt-community-rating'))
      .toHaveAttribute('data-variant', 'summary');
  });

  it('should show the votes beside the percentage when they are passed', () => {
    const { container } = render(CommunityRating, {
      props: {
        rating: 0.8,
        votes: 13_600,
        earliestReleaseDate: RELEASED,
        displayEarlyRatings: false,
        variant: 'summary',
      },
    });

    expect(screen.getByText('80%')).toBeVisible();
    expect(screen.getByText('13.6K votes')).toBeVisible();
    expect(container.querySelector('svg'))
      .toHaveAttribute('data-rating', '8');
  });

  it('should size the votes as a tag', () => {
    render(CommunityRating, {
      props: {
        rating: 0.8,
        votes: 13_600,
        earliestReleaseDate: RELEASED,
        displayEarlyRatings: false,
        variant: 'summary',
      },
    });

    expect(screen.getByText('13.6K votes')).toHaveClass('tag');
  });

  it('should show a vote count of zero', () => {
    render(CommunityRating, {
      props: {
        rating: 0.8,
        votes: 0,
        earliestReleaseDate: RELEASED,
        displayEarlyRatings: false,
      },
    });

    expect(screen.getByText('0 votes')).toBeVisible();
  });

  it('should show no votes when none are passed', () => {
    render(CommunityRating, {
      props: {
        rating: 0.8,
        earliestReleaseDate: RELEASED,
        displayEarlyRatings: false,
      },
    });

    expect(screen.queryByText(/votes/)).not.toBeInTheDocument();
  });

  it('should render nothing before the release, votes and all', () => {
    const { container } = render(CommunityRating, {
      props: {
        rating: 0.8,
        votes: 13_600,
        earliestReleaseDate: UNRELEASED,
        displayEarlyRatings: false,
        variant: 'summary',
      },
    });

    expect(container.children).toHaveLength(0);
  });

  it('should render nothing before the release', () => {
    const { container } = render(CommunityRating, {
      props: {
        rating: 0.74,
        earliestReleaseDate: UNRELEASED,
        displayEarlyRatings: false,
      },
    });

    expect(container.children).toHaveLength(0);
  });

  describe('with early ratings', () => {
    it('should show the rating before the release', () => {
      render(CommunityRating, {
        props: {
          rating: 0.74,
          earliestReleaseDate: UNRELEASED,
          displayEarlyRatings: true,
        },
      });

      expect(screen.getByText('74%')).toBeVisible();
    });

    it('should show the rating of a title without a release date', () => {
      render(CommunityRating, {
        props: {
          rating: 0.74,
          earliestReleaseDate: MAX_DATE,
          displayEarlyRatings: true,
        },
      });

      expect(screen.getByText('74%')).toBeVisible();
    });

    it('should render nothing without a rating', () => {
      const { container } = render(CommunityRating, {
        props: {
          rating: null,
          earliestReleaseDate: UNRELEASED,
          displayEarlyRatings: true,
        },
      });

      expect(container.children).toHaveLength(0);
    });
  });
});
