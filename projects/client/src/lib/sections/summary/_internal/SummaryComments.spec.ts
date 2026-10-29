import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import { COMPLETE_PROGRESS } from '$mocks/data/comments/COMPLETE_PROGRESS.ts';
import { HERETIC_COMMENTS_TARGET } from '$mocks/data/comments/HERETIC_COMMENTS_TARGET.ts';
import { SILO_COMMENTS_TARGET } from '$mocks/data/comments/SILO_COMMENTS_TARGET.ts';
import { HERETIC_ACTIONS_TARGET } from '$mocks/data/media-actions/HERETIC_ACTIONS_TARGET.ts';
import { SILO_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_ACTIONS_TARGET.ts';
import { SILO_COMMENTS_URL } from '$mocks/data/shows/SILO_COMMENTS_URL.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { commentResponse } from '$test/beds/request/commentResponse.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SummaryComments from './SummaryComments.svelte';

function renderComments(status: SectionStatus<number>) {
  openAt('/movies/heretic-2024');
  return renderComponent(SummaryComments, {
    props: {
      status,
      target: HERETIC_COMMENTS_TARGET,
      media: HERETIC_ACTIONS_TARGET,
    },
  });
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

  it('should show the comments under the header when there are comments', async () => {
    renderComments({ kind: 'ready', data: 233 });
    const region = screen.getByRole('region', { name: 'Comments' });

    expect(heading().querySelector('.trakt-pending-spinner')).toBeNull();
    expect(within(region).getByRole('tablist', { name: 'Comments' }))
      .toBeVisible();
    expect(await within(region).findAllByRole('article')).not.toHaveLength(0);
  });
  it('should reveal a spoiler on a show whose progress is complete', async () => {
    openAt('/shows/silo');
    recordSearches(`${SILO_COMMENTS_URL}/likes`, [
      commentResponse({ id: 1, variant: 'spoiler' }),
    ]);
    renderComponent(SummaryComments, {
      props: {
        status: { kind: 'ready', data: 1 },
        target: SILO_COMMENTS_TARGET,
        media: SILO_ACTIONS_TARGET,
        progress: COMPLETE_PROGRESS,
      },
    });

    const card = await screen.findByRole('article');

    expect(card.querySelector('.spoiler-content')).not.toHaveAttribute('inert');
    expect(within(card).queryByRole('button', { name: 'Show spoiler' }))
      .toBeNull();
  });
});
