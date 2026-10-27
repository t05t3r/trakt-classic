import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Footer from './Footer.svelte';

describe('component: Footer', () => {
  it('should link the word Trakt to trakt.tv', () => {
    render(Footer);

    expect(screen.getByRole('link', { name: 'Trakt' }))
      .toHaveAttribute('href', 'https://trakt.tv');
  });

  it('should show the full attribution line', () => {
    render(Footer);

    expect(screen.getByRole('paragraph')).toHaveTextContent(
      /^Powered by Trakt\. Metadata and images are provided by Trakt\.$/,
    );
  });

  // Safari drops the list role of a list with no markers unless it is explicit.
  it('should keep an explicit list role on the links', () => {
    render(Footer);

    expect(screen.getByRole('list')).toHaveAttribute('role', 'list');
  });

  it('should open the source repository in a new tab', () => {
    render(Footer);

    const source = screen.getByRole('link', { name: 'Source' });

    expect(source).toHaveAttribute(
      'href',
      'https://github.com/t05t3r/trakt-classic',
    );
    expect(source).toHaveAttribute('target', '_blank');
    expect(source.getAttribute('rel')?.split(' ')).toContain('noopener');
  });
});
