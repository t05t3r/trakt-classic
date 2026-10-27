import imdbLogo from '$lib/assets/ratings/imdb.svg?no-inline';
import metacriticMediumLogo from '$lib/assets/ratings/metacritic-medium.svg?no-inline';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ExternalRating from './ExternalRating.svelte';

const IMDB_URL = 'https://www.imdb.com/title/tt1745960';

describe('ExternalRating', () => {
  it('should show the source, the value and the caption in a link to the source', () => {
    render(ExternalRating, {
      props: {
        rating: {
          key: 'imdb',
          label: 'IMDb',
          value: '8.2',
          caption: '827.3K',
          url: IMDB_URL,
          logo: imdbLogo,
        },
      },
    });

    const link = screen.getByRole('link', { name: 'IMDb 8.2 827.3K' });

    expect(link).toHaveAttribute('href', IMDB_URL);
    expect(link).toHaveAttribute('target', '_blank');
  });

  it("should show the source's logo in place of its name", () => {
    render(ExternalRating, {
      props: {
        rating: { key: 'imdb', label: 'IMDb', value: '8.2', logo: imdbLogo },
      },
    });

    expect(screen.getByRole('img', { name: 'IMDb' }))
      .toHaveAttribute('src', imdbLogo);
    expect(screen.queryByText('IMDb')).toBeNull();
  });

  it('should show the name of a source that has no logo', () => {
    render(ExternalRating, {
      props: {
        rating: { key: 'mal', label: 'MAL', value: '9.1' },
      },
    });

    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('MAL')).toBeVisible();
  });

  it('should size the caption as a tag', () => {
    render(ExternalRating, {
      props: {
        rating: { key: 'imdb', label: 'IMDb', value: '8.2', caption: '827.3K' },
      },
    });

    expect(screen.getByText('827.3K')).toHaveClass('tag');
  });

  it('should size the name of a source that has no logo as a tag', () => {
    render(ExternalRating, {
      props: {
        rating: { key: 'mal', label: 'MAL', value: '9.1' },
      },
    });

    expect(screen.getByText('MAL')).toHaveClass('tag');
  });

  it('should show the rating as text when the source has no link', () => {
    render(ExternalRating, {
      props: {
        rating: { key: 'letterboxd', label: 'Letterboxd', value: '3.9/5' },
      },
    });

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Letterboxd')).toBeVisible();
    expect(screen.getByText('3.9/5')).toBeVisible();
  });

  it('should draw the metascore bar and the logo in its band', () => {
    const { container } = render(ExternalRating, {
      props: {
        rating: {
          key: 'metacritic',
          label: 'Metacritic',
          value: '63',
          band: 'medium',
          logo: metacriticMediumLogo,
        },
      },
    });

    const banded = container.querySelector('[data-band="medium"]');

    expect(banded).toHaveClass('trakt-external-rating');
    expect(banded?.querySelector('.external-rating-metascore-bar'))
      .not.toBeNull();
    expect(banded).toContainElement(
      screen.getByRole('img', { name: 'Metacritic' }),
    );
  });

  it('should draw no metascore bar for a source without a band', () => {
    const { container } = render(ExternalRating, {
      props: {
        rating: { key: 'mal', label: 'MAL', value: '9.1' },
      },
    });

    expect(container.querySelector('.trakt-external-rating'))
      .not.toHaveAttribute('data-band');
    expect(container.querySelector('.external-rating-metascore-bar'))
      .toBeNull();
  });
});
