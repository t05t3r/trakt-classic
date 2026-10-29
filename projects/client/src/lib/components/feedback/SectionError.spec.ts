import { mountElement } from '$test/beds/dom/mountElement.ts';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SectionError from './SectionError.svelte';

function renderError(retry = vi.fn()) {
  const fallback = mountElement('section');
  const title = mountElement('h2');
  title.id = 'pane-title';
  title.textContent = 'Recent';
  const rendered = render(SectionError, {
    props: { retry, fallback, describedBy: title.id },
  });

  return { ...rendered, fallback };
}

describe('component: SectionError', () => {
  it('should say the section failed and offer a retry in the empty box', () => {
    const { container } = renderError();

    expect(container.querySelector('.trakt-empty-state')?.textContent)
      .toBe("Couldn't load this section. Retry");
  });

  it('should describe the retry by the element it is given', () => {
    renderError();

    expect(screen.getByRole('button', { name: 'Retry' }))
      .toHaveAccessibleDescription('Recent');
  });

  it('should call retry when the retry is pressed', async () => {
    const retry = vi.fn();
    renderError(retry);

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(retry).toHaveBeenCalledOnce();
  });

  it('should hold the focus on its fallback when a pressed retry leaves', async () => {
    const { fallback, unmount } = renderError();

    screen.getByRole('button', { name: 'Retry' }).focus();
    await userEvent.keyboard('{Enter}');
    unmount();

    expect(fallback).toHaveFocus();
  });

  it('should leave the focus alone when the retry leaves unpressed', () => {
    const { fallback, unmount } = renderError();

    unmount();

    expect(document.body).toHaveFocus();
    expect(fallback).not.toHaveAttribute('tabindex');
  });
});
