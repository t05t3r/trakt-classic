import { emulateFocusVisible } from '$test/beds/focus/emulateFocusVisible.ts';
import { stubOverflow } from '$test/beds/layout/stubOverflow.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import HintsHost from '$test/beds/tooltip/HintsHost.svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
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

  it('should take the focus from a hint that opens with it', async () => {
    emulateFocusVisible();
    stubClientRects();
    render(HintsHost);
    await userEvent.keyboard('{Shift}');

    // A menu picked from the keyboard hands the focus back to its hinted trigger as the dialog opens.
    screen.getByRole('link', { name: 'Poster' }).focus();
    render(Modal, { title: 'Title', onClose: vi.fn(), children });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    );
  });
});
