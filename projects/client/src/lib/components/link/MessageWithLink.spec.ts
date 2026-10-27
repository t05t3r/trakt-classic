import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import MessageWithLink from './MessageWithLink.svelte';

describe('component: MessageWithLink', () => {
  it('should render the tagged part as a link to the href', () => {
    const { container } = render(MessageWithLink, {
      props: {
        message: 'Powered by <a>Trakt</a>. Metadata by Trakt.',
        href: 'https://trakt.tv',
      },
    });

    expect(screen.getByRole('link', { name: 'Trakt' }))
      .toHaveAttribute('href', 'https://trakt.tv');
    expect(container.textContent).toBe('Powered by Trakt. Metadata by Trakt.');
  });

  it('should render a message without the tags as text and no link', () => {
    const { container } = render(MessageWithLink, {
      props: { message: 'Powered by Trakt.', href: 'https://trakt.tv' },
    });

    expect(screen.queryByRole('link')).toBeNull();
    expect(container.textContent).toBe('Powered by Trakt.');
  });

  describe('for a message without exactly one well-formed pair', () => {
    it.each([
      {
        scenario: 'two pairs',
        message: 'Powered by <a>Trakt</a> and <a>TMDB</a>.',
        text: 'Powered by Trakt and TMDB.',
      },
      {
        scenario: 'an empty pair',
        message: 'Powered by <a></a>Trakt.',
        text: 'Powered by Trakt.',
      },
      {
        scenario: 'a closing tag before the opening tag',
        message: 'Powered by </a>Trakt<a>.',
        text: 'Powered by Trakt.',
      },
      {
        scenario: 'a lone opening tag',
        message: 'Powered by <a>Trakt.',
        text: 'Powered by Trakt.',
      },
    ])(
      'should render $scenario as plain text without the tags',
      ({ message, text }) => {
        const { container } = render(MessageWithLink, {
          props: { message, href: 'https://trakt.tv' },
        });

        expect(screen.queryByRole('link')).toBeNull();
        expect(container.textContent).toBe(text);
      },
    );
  });
});
