import { commentResponse } from '$test/beds/request/commentResponse.ts';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import CommentMarkdown from './CommentMarkdown.svelte';

const MARKDOWN = commentResponse({ id: 1, variant: 'markdown' }).comment;
const XSS = commentResponse({ id: 1, variant: 'xss' }).comment;

function renderMarkdown(markdown: string) {
  return render(CommentMarkdown, { props: { markdown } });
}

function showSpoiler() {
  return screen.queryByRole('button', { name: 'Show spoiler' });
}

describe('CommentMarkdown', () => {
  it('should render strong and emphasis', () => {
    renderMarkdown(MARKDOWN);

    expect(screen.getByText('Strong').tagName).toBe('STRONG');
    expect(screen.getByText('emphasis').tagName).toBe('EM');
  });

  it('should render a list', () => {
    renderMarkdown(MARKDOWN);

    expect(screen.getAllByRole('listitem').map((item) => item.textContent))
      .toEqual(['first', 'second']);
  });

  it('should number an ordered list', () => {
    const { container } = renderMarkdown('1. first\n2. second');

    expect(container.querySelector('ol')).toHaveTextContent('firstsecond');
  });

  it('should break a line at a single newline', () => {
    const { container } = renderMarkdown('one\ntwo');

    const paragraph = container.querySelector('p');

    expect(paragraph?.querySelectorAll('br')).toHaveLength(1);
    expect(paragraph).toHaveTextContent('onetwo');
  });

  it('should render a heading as a bold paragraph', () => {
    const { container } = renderMarkdown('# A title');

    expect(container.querySelector('h1')).not.toBeInTheDocument();
    expect(container.querySelector('p > strong')).toHaveTextContent('A title');
  });

  it.each(['http://trakt.tv/', 'https://trakt.tv/'])(
    'should render a link to %s',
    (href) => {
      renderMarkdown(`[a link](${href})`);

      expect(screen.getByRole('link', { name: 'a link' }))
        .toHaveAttribute('href', href);
    },
  );

  it('should mark a link nofollow, with no opener and no referrer', () => {
    renderMarkdown('[a link](https://trakt.tv/)');

    expect(screen.getByRole('link', { name: 'a link' })).toHaveAttribute(
      'rel',
      'external nofollow noopener noreferrer',
    );
  });

  it('should space a quote as the blocks beside it', () => {
    const { container } = renderMarkdown('before\n\n> quoted\n\nafter');

    expect(container.querySelector('blockquote')).toHaveClass('comment-block');
    expect(container.querySelector('p')).toHaveClass('comment-block');
  });

  it('should render a deeply nested body as its text', () => {
    const markdown = `${'>'.repeat(300)}x`;

    const { container } = renderMarkdown(markdown);

    expect(container.querySelector('blockquote')).not.toBeInTheDocument();
    expect(container).toHaveTextContent(markdown);
  });

  it('should strike text through', () => {
    renderMarkdown('~~gone~~');

    expect(screen.getByText('gone').tagName).toBe('DEL');
  });

  describe('for an unsafe body', () => {
    it('should render a script and raw HTML as text', () => {
      const { container } = renderMarkdown(XSS);

      expect(container.querySelector('script, img')).not.toBeInTheDocument();
      expect(container).toHaveTextContent(XSS);
    });

    it('should render no link to a javascript: URL, only its raw text', () => {
      const { container } = renderMarkdown('[x](javascript:alert(1))');

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(container).toHaveTextContent(/^\[x\]\(javascript:alert\(1\)\)$/);
    });
  });

  describe('for an inline spoiler', () => {
    function spoiler() {
      return screen.getByText('hidden ending');
    }

    it('should blur the spoiler behind its own reveal', () => {
      renderMarkdown(MARKDOWN);

      expect(spoiler()).toHaveClass('is-blurred');
      expect(showSpoiler()).toHaveAttribute('aria-expanded', 'false');
    });

    it('should reveal the spoiler and move the focus to it', async () => {
      renderMarkdown(MARKDOWN);

      await userEvent.click(
        screen.getByRole('button', { name: 'Show spoiler' }),
      );

      expect(spoiler()).not.toHaveClass('is-blurred');
      expect(spoiler()).toHaveFocus();
    });

    it('should blur a spoiler inside a quote', () => {
      const { container } = renderMarkdown(
        '> [spoiler]hidden ending[/spoiler]',
      );

      expect(container.querySelector('blockquote > p')).toContainElement(
        spoiler(),
      );
      expect(spoiler()).toHaveClass('is-blurred');
    });
  });
});
