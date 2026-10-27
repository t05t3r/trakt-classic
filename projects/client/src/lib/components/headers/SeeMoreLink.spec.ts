import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import SeeMoreLink from './SeeMoreLink.svelte';

describe('component: SeeMoreLink', () => {
  it('should link to its target under its label', () => {
    render(SeeMoreLink, {
      props: { href: '/users/me/progress', label: 'Progress' },
    });

    const link = screen.getByRole('link', { name: 'Progress' });
    expect(link).toHaveAttribute('href', '/users/me/progress');
    expect(link).toHaveTextContent('Progress');
  });

  it('should mark its chevron as directional and hide it from assistive technology', () => {
    const { container } = render(SeeMoreLink, {
      props: { href: '/users/me/progress', label: 'Progress' },
    });

    const chevron = container.querySelector('svg');
    expect(chevron).toHaveClass('tabler-icon-circle-chevron-right');
    expect(chevron).toHaveClass('trakt-icon-directional');
    expect(chevron).toHaveAttribute('aria-hidden', 'true');
  });

  it('should keep its label as the accessible name when the text hides', () => {
    render(SeeMoreLink, {
      props: { href: '/users/me/progress', label: 'Progress' },
    });

    const link = screen.getByRole('link', { name: 'Progress' });
    expect(link).toHaveAttribute('aria-label', 'Progress');
  });

  it('should name the link by its label followed by its context', () => {
    render(SeeMoreLink, {
      props: {
        href: '/shows/recommendations',
        label: 'More',
        context: 'show recommendations',
      },
    });

    const link = screen.getByRole('link', {
      name: 'More show recommendations',
    });
    expect(link).toHaveAttribute('href', '/shows/recommendations');
    expect(link).toHaveTextContent('More');
  });
});
