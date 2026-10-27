import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SummaryComments from './SummaryComments.svelte';

function renderComments(status: SectionStatus<number>) {
  return render(SummaryComments, { props: { status } });
}

function heading() {
  return screen.getByRole('heading', { level: 2, name: 'Comments' });
}

describe('SummaryComments', () => {
  it('should spin after the title while the count loads', () => {
    const { container } = renderComments({ kind: 'loading' });

    expect(heading().querySelector('.trakt-pending-spinner')).not.toBeNull();
    expect(container.querySelector('.trakt-empty-state')).toBeNull();
  });

  it('should offer a retry when the count fails to load', async () => {
    const retry = vi.fn();
    renderComments({ kind: 'error', retry });

    expect(heading()).toBeVisible();
    expect(screen.getByText("Couldn't load this section.")).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(retry).toHaveBeenCalledOnce();
  });

  it('should show the empty state when there are no comments', () => {
    renderComments({ kind: 'empty' });

    expect(heading()).toBeVisible();
    expect(screen.getByText('No comments yet.')).toBeVisible();
  });

  it('should show the header alone when there are comments', () => {
    const { container } = renderComments({ kind: 'ready', data: 233 });

    expect(heading().querySelector('.trakt-pending-spinner')).toBeNull();
    expect(container.querySelector('.trakt-empty-state')).toBeNull();
  });
});
