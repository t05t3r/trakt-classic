import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { render, screen } from '@testing-library/svelte';
import IconPlayerTrackNext from '@tabler/icons-svelte/icons/player-track-next';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import SectionHeader from './SectionHeader.svelte';

const tools = createRawSnippet(() => ({
  render: () => '<a href="/users/me/progress">Progress</a>',
}));

const boldTitle = createRawSnippet(() => ({
  render: () => '<span>If you like <b>FROM</b>, check out...</span>',
}));

const helpText = createRawSnippet(() => ({
  render: () => '<span>Sorted by activity date.</span>',
}));

describe('component: SectionHeader', () => {
  it('should title the section with a level-two heading', () => {
    render(SectionHeader, { props: { title: 'Up Next' } });

    expect(screen.getByRole('heading', { level: 2, name: 'Up Next' }))
      .toBeVisible();
  });

  it('should lead the title with its icon, hidden from assistive technology', () => {
    render(SectionHeader, {
      props: { title: 'Up Next', icon: IconPlayerTrackNext },
    });

    const heading = screen.getByRole('heading', { level: 2, name: 'Up Next' });
    const icon = heading.querySelector('svg');
    const title = Array.from(heading.childNodes).find(
      (node) =>
        node.nodeType === Node.TEXT_NODE && node.textContent === 'Up Next',
    );

    expect(icon).toHaveClass('tabler-icon-player-track-next');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(assertDefined(icon).compareDocumentPosition(assertDefined(title)))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('should show the pending spinner after the title while loading', () => {
    render(SectionHeader, { props: { title: 'Up Next', loading: true } });

    const heading = screen.getByRole('heading', { level: 2 });
    const title = Array.from(heading.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE,
    );
    const spinner = heading.querySelector('.trakt-pending-spinner');

    expect(title?.textContent).toBe('Up Next');
    expect(assertDefined(title).compareDocumentPosition(assertDefined(spinner)))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('should show no pending spinner while not loading', () => {
    render(SectionHeader, { props: { title: 'Up Next', loading: false } });

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.querySelector('.trakt-pending-spinner')).toBeNull();
  });

  it.each([
    [true, true],
    [false, false],
  ])(
    'should hold the title text alone, with icon %s and loading %s',
    (withIcon, loading) => {
      render(SectionHeader, {
        props: {
          title: 'Up Next',
          icon: withIcon ? IconPlayerTrackNext : undefined,
          loading,
        },
      });

      expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
        'Up Next',
      );
    },
  );

  it('should render a snippet title inside the heading', () => {
    render(SectionHeader, { props: { title: boldTitle } });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'If you like FROM, check out...',
    });
    expect(heading.querySelector('b')?.textContent).toBe('FROM');
  });

  it('should set its tools beside the heading, outside its name', () => {
    render(SectionHeader, { props: { title: 'Up Next', tools } });

    expect(screen.getByRole('heading', { level: 2, name: 'Up Next' }))
      .toBeVisible();
    expect(screen.getByRole('link', { name: 'Progress' })).toBeVisible();
  });

  it('should give its title the id it is handed', () => {
    render(SectionHeader, {
      props: { title: 'Up Next', titleId: 'up-next-title' },
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Up Next' }))
      .toHaveAttribute('id', 'up-next-title');
  });

  it.each(
    [
      [undefined, 'default'],
      ['default', 'default'],
      ['wide', 'wide'],
    ] as const,
  )(
    'should mark spacing %s on its root as %s',
    (spacing, marked) => {
      const { container } = render(SectionHeader, {
        props: { title: 'Recently Watched', spacing },
      });

      expect(container.querySelector('.trakt-section-header'))
        .toHaveAttribute('data-spacing', marked);
    },
  );

  it.each(
    [
      [undefined, 'default'],
      ['default', 'default'],
      ['none', 'none'],
      ['compact', 'compact'],
    ] as const,
  )(
    'should mark help text gap %s on its root as %s',
    (helpTextGap, marked) => {
      const { container } = render(SectionHeader, {
        props: { title: 'Up Next', helpText, helpTextGap },
      });

      expect(container.querySelector('.trakt-section-header'))
        .toHaveAttribute('data-help-text-gap', marked);
    },
  );

  it('should set its help text under the heading as a paragraph', () => {
    render(SectionHeader, { props: { title: 'Up Next', helpText } });

    expect(screen.getByRole('paragraph')).toHaveTextContent(
      'Sorted by activity date.',
    );
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
  });
});
