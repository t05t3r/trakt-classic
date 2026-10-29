import type { CommentResponseWithGif } from '$lib/requests/models/CommentResponseWithGif.ts';

export type CommentVariant =
  | 'spoiler'
  | 'review'
  | 'unrated'
  | 'long'
  | 'markdown'
  | 'xss'
  | 'gravatar';

export type CommentResponseParams = {
  id: number;
  variant?: CommentVariant;
};

const GRAVATAR =
  'https://secure.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50?s=256';

const LONG_BODY = Array.from(
  { length: 12 },
  (_, index) => `Paragraph ${index + 1} of a comment long enough to clamp.`,
).join('\n\n');

const MARKDOWN_BODY = [
  '**Strong**, _emphasis_ and a [link](https://trakt.tv).',
  '- first\n- second',
  'An inline [spoiler]hidden ending[/spoiler] in a line.',
].join('\n\n');

const XSS_BODY =
  '<script>alert(1)</script><img src="x" onerror="alert(1)"> [x](javascript:alert(1))';

const VARIANTS: Readonly<
  Record<
    CommentVariant,
    (comment: CommentResponseWithGif) => CommentResponseWithGif
  >
> = {
  spoiler: (comment) => ({ ...comment, spoiler: true }),
  review: (comment) => ({ ...comment, review: true }),
  unrated: (comment) => ({
    ...comment,
    user_rating: null,
    user_stats: { ...comment.user_stats, rating: null },
  }),
  long: (comment) => ({ ...comment, comment: LONG_BODY }),
  markdown: (comment) => ({ ...comment, comment: MARKDOWN_BODY }),
  xss: (comment) => ({ ...comment, comment: XSS_BODY }),
  gravatar: (comment) => ({
    ...comment,
    user: { ...comment.user, images: { avatar: { full: GRAVATAR } } },
  }),
};

export function commentResponse(
  { id, variant }: CommentResponseParams,
): CommentResponseWithGif {
  const comment: CommentResponseWithGif = {
    id,
    parent_id: 0,
    created_at: '2024-11-08T06:21:26.000Z',
    updated_at: '2024-11-08T06:21:26.000Z',
    comment: `Comment ${id}`,
    gif: null,
    spoiler: false,
    review: false,
    replies: 0,
    likes: 0,
    language: 'en',
    user_rating: 8,
    user_stats: { rating: 8, play_count: 1, completed_count: 1 },
    user: {
      username: `user-${id}`,
      private: false,
      deleted: false,
      name: `User ${id}`,
      vip: false,
      vip_ep: false,
      director: false,
      ids: { slug: `user-${id}`, trakt: id },
      images: {
        avatar: {
          full:
            `https://media.trakt.tv/images/users/000/000/001/avatars/medium/user-${id}.jpg`,
        },
      },
    },
  };

  return variant ? VARIANTS[variant](comment) : comment;
}
