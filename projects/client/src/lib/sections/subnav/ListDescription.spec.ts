import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ListDescription from './ListDescription.svelte';

const TEXT = 'Movies, shows, seasons, and episodes I plan to watch.';

describe('component: ListDescription', () => {
  it('should set its text as a paragraph inside the clamp', () => {
    render(ListDescription, { props: { text: TEXT } });

    const paragraph = screen.getByText(TEXT);
    expect(paragraph.tagName).toBe('P');
    expect(paragraph.closest('.clamped-content')).toHaveClass('is-clamped');
  });
});
