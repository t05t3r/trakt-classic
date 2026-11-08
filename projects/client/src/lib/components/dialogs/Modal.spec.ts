import { stubOverflow } from '$test/beds/layout/stubOverflow.ts';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import Modal from './Modal.svelte';

const children = createRawSnippet(() => ({
  render: () => '<p>Body text</p>',
}));

const body = () => screen.getByText('Body text').parentElement;

describe('component: Modal', () => {
  it('should make a body that overflows a tab stop', () => {
    stubOverflow();

    render(Modal, { title: 'Title', onClose: vi.fn(), children });

    expect(body()).toHaveAttribute('tabindex', '0');
  });

  it('should leave a body that fits out of the tab order', () => {
    render(Modal, { title: 'Title', onClose: vi.fn(), children });

    expect(body()).not.toHaveAttribute('tabindex');
  });
});
