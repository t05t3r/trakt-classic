import { REPLIED_COMMENT_ID } from '$mocks/data/comments/REPLIED_COMMENT_ID.ts';
import { REPLIED_COMMENT_REPLIES_URL } from '$mocks/data/comments/REPLIED_COMMENT_REPLIES_URL.ts';
import type { MediaComment } from '$lib/requests/models/MediaComment.ts';
import { server } from '$mocks/server.ts';
import { mediaComment } from '$test/beds/comments/mediaComment.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { commentResponse } from '$test/beds/request/commentResponse.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import CommentThread from './CommentThread.svelte';

const REPLIES = [commentResponse({ id: 2 }), commentResponse({ id: 3 })];

function commentWithReplies(replyCount: number): MediaComment {
  return { ...mediaComment({ id: REPLIED_COMMENT_ID }), replyCount };
}

function renderThread(replyCount = 4) {
  return renderComponent(CommentThread, {
    props: { comment: commentWithReplies(replyCount) },
  });
}

function toggle() {
  return screen.getByRole('button', { name: '4 replies' });
}

function replyBodies() {
  return screen.queryAllByText(/^Comment [23]$/).map((body) =>
    body.textContent
  );
}

describe('component: CommentThread', () => {
  it('should offer its reply count as a collapsed toggle', () => {
    renderThread();

    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(toggle().querySelector('svg')).toHaveClass(
      'tabler-icon-message-circle-filled',
    );
  });

  it('should set the figure right after the glyph, with no space between', () => {
    renderThread();

    expect(toggle().textContent).toBe('4 replies');
  });

  it("should set the toggle's word in its own element, which a phone hides", () => {
    renderThread();

    expect(toggle().querySelector('.comment-replies-word')?.textContent).toBe(
      'replies',
    );
  });

  it('should ask for no replies until the toggle is pressed', async () => {
    const searches = recordSearches(REPLIED_COMMENT_REPLIES_URL, REPLIES);
    renderThread();

    await waitNegativeClaim();

    expect(searches).toHaveLength(0);
  });

  it('should expand the replies under the comment, then collapse them', async () => {
    const searches = recordSearches(REPLIED_COMMENT_REPLIES_URL, REPLIES);
    renderThread();

    await userEvent.click(toggle());
    await waitFor(() =>
      expect(replyBodies()).toEqual(['Comment 2', 'Comment 3'])
    );
    const expanded = toggle().getAttribute('aria-expanded');
    await userEvent.click(toggle());

    expect(searches).toHaveLength(1);
    expect(expanded).toBe('true');
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(replyBodies()).toEqual([]);
  });

  it('should control the box that holds the replies', async () => {
    recordSearches(REPLIED_COMMENT_REPLIES_URL, REPLIES);
    renderThread();

    await userEvent.click(toggle());
    const [reply] = await screen.findAllByText('Comment 2');
    const box = document.getElementById(
      toggle().getAttribute('aria-controls') ?? '',
    );

    expect(box).toContainElement(reply ?? null);
  });

  it('should render each reply as a reply card', async () => {
    recordSearches(REPLIED_COMMENT_REPLIES_URL, REPLIES);
    renderThread();

    await userEvent.click(toggle());
    await screen.findAllByText('Comment 2');

    expect(
      [...document.querySelectorAll('.trakt-comment-card')].map((card) =>
        card.getAttribute('data-placement')
      ),
    ).toEqual(['block', 'reply', 'reply']);
  });

  it('should spin while the replies load', async () => {
    recordSearches(REPLIED_COMMENT_REPLIES_URL, REPLIES);
    const replies = holdRequest({
      method: 'get',
      url: REPLIED_COMMENT_REPLIES_URL,
    });
    const { container } = renderThread();

    await userEvent.click(toggle());
    await replies.requested;
    const spinner = container.querySelector('.trakt-pending-spinner');
    replies.release();

    expect(spinner).not.toBeNull();
    expect(await screen.findByText('Comment 2')).toBeInTheDocument();
    expect(container.querySelector('.trakt-pending-spinner')).toBeNull();
  });

  it('should offer a retry when the replies fail, and hold the focus in their box', async () => {
    server.use(http.get(REPLIED_COMMENT_REPLIES_URL, notFound));
    renderThread();
    await userEvent.click(toggle());
    const retry = await screen.findByRole('button', { name: 'Retry' });
    const box = document.getElementById(
      toggle().getAttribute('aria-controls') ?? '',
    )?.firstElementChild;
    recordSearches(REPLIED_COMMENT_REPLIES_URL, REPLIES);

    retry.focus();
    await userEvent.keyboard('{Enter}');

    expect(await screen.findByText('Comment 2')).toBeInTheDocument();
    expect(box).toHaveFocus();
  });

  it("should describe the replies' retry by the comment's heading", async () => {
    server.use(http.get(REPLIED_COMMENT_REPLIES_URL, notFound));
    renderThread();
    await userEvent.click(toggle());

    const retry = await screen.findByRole('button', { name: 'Retry' });

    expect(retry).toHaveAccessibleDescription(
      `Shout by User ${REPLIED_COMMENT_ID}`,
    );
  });

  it('should say so under the comment when its replies come back empty', async () => {
    recordSearches(REPLIED_COMMENT_REPLIES_URL, []);
    const { container } = renderThread();

    await userEvent.click(toggle());
    const empty = await screen.findByText('No replies to show.');

    expect(empty).toHaveClass('trakt-empty-state');
    expect(document.getElementById(
      toggle().getAttribute('aria-controls') ?? '',
    )).toContainElement(empty);
    expect(container.querySelectorAll('.trakt-comment-card')).toHaveLength(1);
  });

  it('should read no replies as plain text with no toggle', () => {
    const { container } = renderThread(0);

    expect(container.querySelector('.comment-footer')).toContainElement(
      screen.getByText('0 replies'),
    );
    expect(container.querySelector('.comment-replies-word')).toBeNull();
    expect(screen.queryByRole('button', { name: /replies/ })).toBeNull();
  });

  it('should name a single reply in the singular', () => {
    renderThread(1);

    expect(screen.getByRole('button', { name: '1 reply' })).toBeInTheDocument();
  });
});
