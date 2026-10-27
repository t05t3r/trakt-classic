import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import CaptionTag from './CaptionTag.svelte';

const children = createRawSnippet(() => ({
  render: () => '<span>6 Jul 2026 20:04</span>',
}));

describe('component: CaptionTag', () => {
  it('should render its content in a span on the accent by default', () => {
    render(CaptionTag, { props: { children } });

    const tag = screen.getByText('6 Jul 2026 20:04').parentElement;
    expect(tag?.tagName).toBe('SPAN');
    expect(tag).toHaveClass('trakt-caption-tag');
    expect(tag).toHaveAttribute('data-color', 'accent');
  });

  it('should carry the list colour', () => {
    render(CaptionTag, { props: { children, color: 'list' } });

    expect(screen.getByText('6 Jul 2026 20:04').parentElement)
      .toHaveAttribute('data-color', 'list');
  });
});
