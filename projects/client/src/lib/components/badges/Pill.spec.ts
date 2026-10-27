import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import Pill from './Pill.svelte';

const children = createRawSnippet(() => ({
  render: () => '<span>Official List</span>',
}));

describe('component: Pill', () => {
  it('should render its content in a pill span', () => {
    render(Pill, { props: { children } });

    const pill = screen.getByText('Official List').parentElement;
    expect(pill?.tagName).toBe('SPAN');
    expect(pill).toHaveClass('trakt-pill');
  });
});
