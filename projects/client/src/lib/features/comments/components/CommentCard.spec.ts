import type { MediaComment } from '$lib/requests/models/MediaComment.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { mediaComment } from '$test/beds/comments/mediaComment.ts';
import { emulateHydrated } from '$test/beds/hydration/emulateHydrated.ts';
import { stubOverflow } from '$test/beds/layout/stubOverflow.ts';
import { controlResize } from '$test/beds/resize/controlResize.ts';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { createRawSnippet, tick } from 'svelte';
import { describe, expect, it } from 'vitest';
import type { CommentCardProps } from './_internal/CommentCardProps.ts';
import CommentCard from './CommentCard.svelte';

type Stats = MediaComment['user']['stats'];

function commentWith(stats: Partial<Stats>): MediaComment {
  const comment = mediaComment({ id: 1 });

  return {
    ...comment,
    user: { ...comment.user, stats: { ...comment.user.stats, ...stats } },
  };
}

// A flagged body holding an inline spoiler.
function flaggedMarkdown(): MediaComment {
  return { ...mediaComment({ id: 1, variant: 'markdown' }), isSpoiler: true };
}

function watchedStat(container: HTMLElement) {
  return container.querySelector('.comment-watched');
}

function renderCard(props: Partial<CommentCardProps> = {}) {
  return render(CommentCard, {
    props: { comment: mediaComment({ id: 1 }), placement: 'block', ...props },
  });
}

function avatarImage(container: HTMLElement) {
  return container.querySelector('.comment-avatar img.image');
}

function showSpoiler() {
  return screen.queryByRole('button', { name: 'Show spoiler' });
}

function readMore() {
  return screen.queryByRole('button', { name: 'Read more' });
}

function spoilerContent(container: HTMLElement) {
  return container.querySelector('.comment-body .spoiler-content');
}

function bodyReveal(container: HTMLElement) {
  return assertDefined(
    container.querySelector<HTMLElement>(
      '.comment-body > .trakt-spoiler-reveal > .reveal-button',
    ),
    'The body has no reveal button.',
  );
}

function inlineReveal(container: HTMLElement) {
  return assertDefined(
    container.querySelector<HTMLElement>(
      '[data-display="inline"] > .reveal-button',
    ),
    'The inline spoiler has no reveal button.',
  );
}

// An inline spoiler keeps its own reveal, boxed while concealed.
function inlineSpoilerState(container: HTMLElement) {
  const inline = assertDefined(
    container.querySelector('[data-display="inline"]'),
    'The body has no inline spoiler.',
  );
  return inline.classList.contains('is-concealed') ? 'concealed' : 'revealed';
}

function heading() {
  return screen.getByRole('heading', { level: 3 });
}

describe('CommentCard', () => {
  describe('header', () => {
    it('should head a shout with its author in bold', () => {
      renderCard();

      expect(heading()).toHaveTextContent('Shout by User 1');
      expect(screen.getByText('User 1').tagName).toBe('B');
    });

    it('should head a review with its author in bold', () => {
      renderCard({ comment: mediaComment({ id: 1, variant: 'review' }) });

      expect(heading()).toHaveTextContent('Review by User 1');
    });

    it('should mark a spoiler with the Spoilers pill', () => {
      renderCard({ comment: mediaComment({ id: 1, variant: 'spoiler' }) });

      expect(screen.getByText('Spoilers')).toHaveClass('trakt-pill');
    });

    it('should carry no pill on a comment that spoils nothing', () => {
      renderCard();

      expect(screen.queryByText('Spoilers')).not.toBeInTheDocument();
    });

    it("should show the author's avatar from the image proxy", () => {
      const { container } = renderCard();

      expect(avatarImage(container)).toHaveAttribute(
        'src',
        '/img/users/000/000/001/avatars/medium/user-1.jpg',
      );
    });

    it('should show a Gravatar avatar from Gravatar', () => {
      const { container } = renderCard({
        comment: mediaComment({ id: 1, variant: 'gravatar' }),
      });

      expect(avatarImage(container)).toHaveAttribute(
        'src',
        'https://secure.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50?s=256&d=404',
      );
    });

    it("should colour the avatar and show the corner by the author's rating", () => {
      const { container } = renderCard();

      expect(container.querySelector('.comment-avatar'))
        .toHaveAttribute('data-rating', '8');
      expect(screen.getByRole('img', { name: "User 1's rating: 8" }))
        .toHaveTextContent('8');
    });

    it("should leave an unrated author's avatar uncoloured and cornerless", () => {
      const { container } = renderCard({
        comment: mediaComment({ id: 1, variant: 'unrated' }),
      });

      expect(container.querySelector('.comment-avatar'))
        .not.toHaveAttribute('data-rating');
      expect(container.querySelector('.trakt-corner-rating'))
        .not.toBeInTheDocument();
    });

    it('should leave the date out until the app hydrates', async () => {
      renderCard();

      expect(screen.queryByText('8 Nov 2024 06:21')).not.toBeInTheDocument();

      emulateHydrated();

      expect(await screen.findByText('8 Nov 2024 06:21')).toBeInTheDocument();
    });
  });

  describe('body', () => {
    it('should render the comment as Markdown', () => {
      renderCard({ comment: mediaComment({ id: 1, variant: 'markdown' }) });

      expect(screen.getByText('Strong').tagName).toBe('STRONG');
    });

    it('should offer a collapsed Read more on a body taller than the clamp', () => {
      stubOverflow();
      renderCard({ comment: mediaComment({ id: 1, variant: 'long' }) });

      expect(readMore()).toHaveAttribute('aria-expanded', 'false');
    });

    it('should offer Read more once a later resize makes the body overflow', async () => {
      const { resize } = controlResize();
      renderCard({ comment: mediaComment({ id: 1, variant: 'long' }) });
      const box = screen.getByText(/^Paragraph 1 /).closest('.clamped-content');

      expect(readMore()).not.toBeInTheDocument();

      stubOverflow();
      resize(box ?? document.body);
      await tick();

      expect(readMore()).toBeInTheDocument();
    });

    it('should blur a spoiler behind a collapsed Show spoiler button', () => {
      const { container } = renderCard({
        comment: mediaComment({ id: 1, variant: 'spoiler' }),
      });

      expect(spoilerContent(container)).toHaveClass('is-blurred');
      expect(showSpoiler()).toHaveAttribute('aria-expanded', 'false');
    });

    it("should keep a spoiler's Read more inert until the reveal", async () => {
      stubOverflow();
      const { container } = renderCard({
        comment: mediaComment({ id: 1, variant: 'spoiler' }),
      });

      expect(readMore()?.closest('[inert]')).toBe(spoilerContent(container));

      await userEvent.click(
        screen.getByRole('button', { name: 'Show spoiler' }),
      );

      expect(spoilerContent(container)).not.toHaveAttribute('inert');
    });

    it('should unblur a spoiler and focus it once revealed', async () => {
      const { container } = renderCard({
        comment: mediaComment({ id: 1, variant: 'spoiler' }),
      });

      await userEvent.click(
        screen.getByRole('button', { name: 'Show spoiler' }),
      );

      expect(spoilerContent(container)).not.toHaveClass('is-blurred');
      expect(showSpoiler()).not.toBeInTheDocument();
      expect(spoilerContent(container)).toHaveFocus();
    });

    it('should hold a body that spoils nothing behind no reveal', () => {
      const { container } = renderCard();

      expect(spoilerContent(container)).not.toBeInTheDocument();
      expect(showSpoiler()).not.toBeInTheDocument();
    });
  });

  describe('footer', () => {
    it('should show the share of aired episodes the author watched', () => {
      const { container } = renderCard({
        comment: commentWith({ completedCount: 33, playCount: 54 }),
        airedEpisodes: 40,
      });

      expect(watchedStat(container)).toHaveTextContent('82% Watched');
      expect(screen.getByText('82%').tagName).toBe('B');
    });

    it('should show a single play', () => {
      const { container } = renderCard({
        comment: commentWith({ playCount: 1 }),
      });

      expect(watchedStat(container)).toHaveTextContent('1 play');
      expect(screen.getByText('1').tagName).toBe('B');
    });

    it('should show a plural play count', () => {
      const { container } = renderCard({
        comment: commentWith({ playCount: 54 }),
      });

      expect(watchedStat(container)).toHaveTextContent('54 plays');
    });

    it('should leave the stat out when the author never played it', () => {
      const { container } = renderCard({
        comment: commentWith({ playCount: 0 }),
      });

      expect(watchedStat(container)).not.toBeInTheDocument();
    });

    it('should render the reply count it is given', () => {
      const replyCount = createRawSnippet(() => ({
        render: () => '<span>4 replies</span>',
      }));
      renderCard({ replyCount });

      expect(screen.getByText('4 replies')).toBeInTheDocument();
    });
  });

  describe('spoiler inputs', () => {
    it('should blur a comment that spoils nothing when told to treat it as a spoiler', () => {
      const { container } = renderCard({ treatAsSpoiler: true });

      expect(spoilerContent(container)).toHaveClass('is-blurred');
      expect(showSpoiler()).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByText('Spoilers')).not.toBeInTheDocument();
    });

    it("should keep an inline spoiler's own reveal in a treated body, before and after the body's reveal", async () => {
      const { container } = renderCard({
        comment: mediaComment({ id: 1, variant: 'markdown' }),
        treatAsSpoiler: true,
      });
      const inlineBefore = inlineSpoilerState(container);

      await userEvent.click(bodyReveal(container));

      expect(inlineBefore).toBe('concealed');
      expect(spoilerContent(container)).not.toHaveClass('is-blurred');
      expect(inlineSpoilerState(container)).toBe('concealed');
    });

    it('should keep an inline spoiler concealed in a flagged body revealed from the start', () => {
      const { container } = renderCard({
        comment: flaggedMarkdown(),
        revealSpoilers: true,
      });

      expect(spoilerContent(container)).not.toHaveClass('is-blurred');
      expect(inlineSpoilerState(container)).toBe('concealed');
    });

    it('should keep an inline spoiler concealed once a press reveals a flagged body', async () => {
      const { container } = renderCard({ comment: flaggedMarkdown() });

      await userEvent.click(bodyReveal(container));

      expect(spoilerContent(container)).not.toHaveClass('is-blurred');
      expect(inlineSpoilerState(container)).toBe('concealed');
    });

    it('should keep an inline spoiler concealed once the watched state turns back', async () => {
      const { container, rerender } = renderCard({
        comment: flaggedMarkdown(),
        revealSpoilers: true,
      });

      await rerender({ revealSpoilers: false });

      expect(spoilerContent(container)).not.toHaveClass('is-blurred');
      expect(inlineSpoilerState(container)).toBe('concealed');
    });

    it('should keep a revealed inline spoiler revealed once a pressed body is revealed by the watched state', async () => {
      const { container, rerender } = renderCard({
        comment: flaggedMarkdown(),
      });
      await userEvent.click(bodyReveal(container));
      await userEvent.click(inlineReveal(container));

      await rerender({ revealSpoilers: true });

      expect(inlineSpoilerState(container)).toBe('revealed');
    });

    it('should show a spoiler revealed from the start, its pill kept', () => {
      const { container } = renderCard({
        comment: mediaComment({ id: 1, variant: 'spoiler' }),
        revealSpoilers: true,
      });

      expect(spoilerContent(container)).not.toHaveClass('is-blurred');
      expect(spoilerContent(container)).not.toHaveAttribute('inert');
      expect(showSpoiler()).not.toBeInTheDocument();
      expect(screen.getByText('Spoilers')).toHaveClass('trakt-pill');
    });

    it('should show a treated body revealed when told to reveal spoilers', () => {
      const { container } = renderCard({
        treatAsSpoiler: true,
        revealSpoilers: true,
      });

      expect(spoilerContent(container)).not.toHaveClass('is-blurred');
      expect(showSpoiler()).not.toBeInTheDocument();
    });

    it('should keep an inline spoiler concealed when told to reveal spoilers', () => {
      renderCard({
        comment: mediaComment({ id: 1, variant: 'markdown' }),
        revealSpoilers: true,
      });

      expect(showSpoiler()).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('reply', () => {
    it('should head a reply one level below a comment', () => {
      renderCard({ placement: 'reply' });

      expect(screen.getByRole('heading', { level: 4 }))
        .toHaveTextContent('Shout by User 1');
      expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
    });

    it('should leave the footer out of a reply, stat and count included', () => {
      const replyCount = createRawSnippet(() => ({
        render: () => '<span>4 replies</span>',
      }));
      const { container } = renderCard({
        placement: 'reply',
        comment: commentWith({ playCount: 54 }),
        replyCount,
      });

      expect(container.querySelector('footer')).toBeNull();
      expect(screen.queryByText('4 replies')).toBeNull();
    });
  });

  it.each(['block', 'hub', 'reply'] as const)(
    'should set the %s placement on the card',
    (placement) => {
      const { container } = renderCard({ placement });

      expect(container.querySelector('.trakt-comment-card'))
        .toHaveAttribute('data-placement', placement);
    },
  );
});
