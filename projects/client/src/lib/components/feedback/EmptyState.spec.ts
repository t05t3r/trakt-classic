import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import EmptyState from './EmptyState.svelte';

const content = createRawSnippet(() => ({
  render: () => '<span>Nothing to watch yet.</span>',
}));

describe('component: EmptyState', () => {
  it('should render the caller content once', () => {
    const { container } = render(EmptyState, { props: { children: content } });

    expect(screen.getByText('Nothing to watch yet.')).toBeVisible();
    expect(container.textContent).toBe('Nothing to watch yet.');
  });
});
