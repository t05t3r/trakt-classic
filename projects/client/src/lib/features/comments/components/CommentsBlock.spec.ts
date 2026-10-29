import { goto } from '$app/navigation';
import { REPLIED_COMMENT_ID } from '$mocks/data/comments/REPLIED_COMMENT_ID.ts';
import { REPLIED_COMMENT_REPLIES_URL } from '$mocks/data/comments/REPLIED_COMMENT_REPLIES_URL.ts';
import { SILO_COMMENTS_TARGET } from '$mocks/data/comments/SILO_COMMENTS_TARGET.ts';
import { SILO_SEASON_COMMENTS_TARGET } from '$mocks/data/comments/SILO_SEASON_COMMENTS_TARGET.ts';
import { COMPLETE_PROGRESS } from '$mocks/data/comments/COMPLETE_PROGRESS.ts';
import { HERETIC_COMMENTS_TARGET } from '$mocks/data/comments/HERETIC_COMMENTS_TARGET.ts';
import { HERETIC_ACTIONS_TARGET } from '$mocks/data/media-actions/HERETIC_ACTIONS_TARGET.ts';
import { SILO_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_ACTIONS_TARGET.ts';
import { SILO_EPISODE_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_EPISODE_ACTIONS_TARGET.ts';
import { SILO_SEASON_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_SEASON_ACTIONS_TARGET.ts';
import { SILO_COMMENTS_URL } from '$mocks/data/shows/SILO_COMMENTS_URL.ts';
import { SILO_EPISODE_COMMENTS_URL } from '$mocks/data/shows/SILO_EPISODE_COMMENTS_URL.ts';
import { SILO_EPISODE_COMMENTS_TARGET } from '$mocks/data/comments/SILO_EPISODE_COMMENTS_TARGET.ts';
import { SILO_SEASON_COMMENTS_URL } from '$mocks/data/shows/SILO_SEASON_COMMENTS_URL.ts';
import { HERETIC_COMMENTS_URL } from '$mocks/data/movies/HERETIC_COMMENTS_URL.ts';
import { HideCommentSpoilersUserSettingsResponseMock } from '$mocks/data/users/response/HideCommentSpoilersUserSettingsResponseMock.ts';
import { USER_SETTINGS_URL } from '$mocks/data/users/USER_SETTINGS_URL.ts';
import { WATCHED_MOVIES_URL } from '$mocks/data/users/WATCHED_MOVIES_URL.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { server } from '$mocks/server.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { commentResponse } from '$test/beds/request/commentResponse.ts';
import { commentPage } from '$test/beds/request/commentPage.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { followReplaces } from '$test/beds/url/followReplaces.svelte.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { stubScrollIntoView } from '$test/beds/scroll/stubScrollIntoView.ts';
import { screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import CommentsBlock from './CommentsBlock.svelte';
import type { CommentsBlockProps } from './CommentsBlockProps.ts';

const MOVIE_PATH = '/movies/heretic-2024';
const LIKES_URL = `${HERETIC_COMMENTS_URL}/likes`;

const MOVIE: CommentsBlockProps = {
  target: HERETIC_COMMENTS_TARGET,
  media: HERETIC_ACTIONS_TARGET,
};

const SHOW: CommentsBlockProps = {
  target: SILO_COMMENTS_TARGET,
  media: SILO_ACTIONS_TARGET,
};

// A spoiler body sits in a reveal, inert while concealed.
function spoilerState(card: HTMLElement) {
  const content = card.querySelector('.comment-body .spoiler-content');
  if (!content) return 'plain';
  return content.hasAttribute('inert') ? 'concealed' : 'revealed';
}

async function statesOf(count: number) {
  const cards = await screen.findAllByRole('article');
  expect(cards).toHaveLength(count);
  return cards.map(spoilerState);
}

function serveHiddenCommentSpoilers() {
  server.use(
    http.get(
      USER_SETTINGS_URL,
      () => HttpResponse.json(HideCommentSpoilersUserSettingsResponseMock),
    ),
  );
}

function serveNoWatchedMovies() {
  server.use(http.get(WATCHED_MOVIES_URL, () => HttpResponse.json([])));
}

function serveLikes() {
  serveTwoPages({
    url: LIKES_URL,
    first: commentPage({ page: 1 }),
    second: () =>
      pagedResponse({ body: commentPage({ page: 2 }), page: 2, pageCount: 2 }),
  });
}

function renderBlock(props: CommentsBlockProps = MOVIE) {
  return renderComponent(CommentsBlock, { props });
}

function panel() {
  return screen.getByRole('tabpanel');
}

function bodies() {
  return within(panel()).queryAllByText(/^Comment \d+$/).map((body) =>
    body.textContent
  );
}

function ids(from: number, to: number) {
  return Array.from(
    { length: to - from + 1 },
    (_, index) => `Comment ${from + index}`,
  );
}

async function shown(count: number) {
  await waitFor(() => expect(bodies()).toHaveLength(count));
  return bodies();
}

describe('component: CommentsBlock', () => {
  it('should open on Likes All Time with its first three cards', async () => {
    openAt(MOVIE_PATH);
    serveLikes();
    renderBlock();

    expect(await shown(3)).toEqual(ids(1, 3));
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent?.trim()))
      .toEqual(['Likes All Time', 'Recent']);
    expect(screen.getByRole('tab', { selected: true }))
      .toHaveTextContent('Likes All Time');
  });

  it('should reveal the rest of page one, then page two, and less back to three', async () => {
    // "less" scrolls its controls into view, which jsdom cannot do.
    stubScrollIntoView();
    openAt(MOVIE_PATH);
    serveLikes();
    renderBlock();
    await shown(3);

    await userEvent.click(screen.getByRole('button', { name: 'more' }));
    const restOfPageOne = await shown(10);
    await userEvent.click(screen.getByRole('button', { name: 'more' }));
    const pageTwo = await shown(20);
    const moreAtTheEnd = screen.queryByRole('button', { name: 'more' });
    await userEvent.click(screen.getByRole('button', { name: 'less' }));

    expect(restOfPageOne).toEqual(ids(1, 10));
    expect(pageTwo).toEqual(ids(1, 20));
    expect(moreAtTheEnd).toBeNull();
    expect(await shown(3)).toEqual(ids(1, 3));
    expect(screen.queryByRole('button', { name: 'less' })).toBeNull();
  });

  it('should switch to Recent with a replace and show its own first three', async () => {
    followReplaces(MOVIE_PATH);
    serveLikes();
    recordSearches(`${HERETIC_COMMENTS_URL}/newest`, commentPage({ page: 3 }));
    renderBlock();
    await shown(3);

    await userEvent.click(screen.getByRole('tab', { name: 'Recent' }));

    expect(await shown(3)).toEqual(ids(21, 23));
    expect(goto).toHaveBeenCalledExactlyOnceWith(
      expect.any(URL),
      expect.objectContaining({ replaceState: true }),
    );
    expect(lastReplace()).toBe(`${MOVIE_PATH}?comments=recent`);
    expect(screen.getByRole('tab', { selected: true }))
      .toHaveTextContent('Recent');
  });

  it('should say so in the pane when the tab has no comments', async () => {
    openAt(MOVIE_PATH);
    recordSearches(LIKES_URL, []);
    renderBlock();

    expect(await within(panel()).findByText('No comments yet.')).toBeVisible();
    expect(screen.queryByRole('article')).toBeNull();
    expect(screen.queryByRole('button', { name: 'more' })).toBeNull();
  });

  it('should spin in a busy pane while the tab loads', async () => {
    openAt(MOVIE_PATH);
    const likes = holdRequest({ method: 'get', url: LIKES_URL });
    renderBlock();
    await likes.requested;

    const spinner = panel().querySelector('.trakt-pending-spinner');
    const pane = panel().firstElementChild;
    likes.release();

    expect(spinner).not.toBeNull();
    expect(pane).toHaveAttribute('aria-busy', 'true');
    expect(await screen.findAllByRole('article')).not.toHaveLength(0);
    expect(pane).toHaveAttribute('aria-busy', 'false');
    expect(panel().querySelector('.trakt-pending-spinner')).toBeNull();
  });

  it("should keep the pane's spinner until the viewer's settings land", async () => {
    openAt(MOVIE_PATH);
    const settings = holdRequest({ method: 'get', url: USER_SETTINGS_URL });
    const searches = recordSearches(LIKES_URL, [commentResponse({ id: 1 })]);
    renderBlock();
    await settings.requested;
    await waitFor(() => expect(searches).toHaveLength(1));
    await waitNegativeClaim();

    const spinner = panel().querySelector('.trakt-pending-spinner');
    const cards = screen.queryAllByRole('article');
    settings.release();

    expect(spinner).not.toBeNull();
    expect(cards).toHaveLength(0);
    expect(await screen.findAllByRole('article')).toHaveLength(1);
  });

  it('should offer a retry in the pane when the tab fails, and hold the focus in the pane', async () => {
    openAt(MOVIE_PATH);
    server.use(http.get(LIKES_URL, notFound));
    renderBlock();
    const retry = await within(panel()).findByRole('button', { name: 'Retry' });
    const box = retry.closest('.trakt-empty-state');
    const pane = panel().firstElementChild;
    serveLikes();

    retry.focus();
    await userEvent.keyboard('{Enter}');

    expect(box?.textContent).toBe("Couldn't load this section. Retry");
    expect(await shown(3)).toEqual(ids(1, 3));
    expect(pane).toHaveFocus();
  });

  it.each([
    { path: MOVIE_PATH, sort: 'likes', tab: 'Likes All Time' },
    { path: `${MOVIE_PATH}?comments=recent`, sort: 'newest', tab: 'Recent' },
  ])(
    "should describe the pane's retry by the shown tab, $tab",
    async ({ path, sort, tab }) => {
      openAt(path);
      server.use(http.get(`${HERETIC_COMMENTS_URL}/${sort}`, notFound));
      renderBlock();

      const retry = await within(panel()).findByRole('button', {
        name: 'Retry',
      });

      expect(retry).toHaveAccessibleDescription(tab);
    },
  );

  it("should expand a comment's replies under its card", async () => {
    openAt(MOVIE_PATH);
    recordSearches(LIKES_URL, [{
      ...commentResponse({ id: REPLIED_COMMENT_ID }),
      replies: 2,
    }]);
    recordSearches(REPLIED_COMMENT_REPLIES_URL, [
      commentResponse({ id: 2 }),
      commentResponse({ id: 3 }),
    ]);
    renderBlock();

    await userEvent.click(
      await screen.findByRole('button', { name: '2 replies' }),
    );

    expect(await shown(3)).toEqual(ids(1, 3));
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(2);
  });

  it.each(
    [
      {
        name: "a show's aired episodes",
        props: {
          target: SILO_COMMENTS_TARGET,
          media: SILO_ACTIONS_TARGET,
        },
        url: SILO_COMMENTS_URL,
        stat: '5% Watched',
      },
      {
        name: "a season's aired episodes",
        props: {
          target: SILO_SEASON_COMMENTS_TARGET,
          media: SILO_SEASON_ACTIONS_TARGET,
        },
        url: SILO_SEASON_COMMENTS_URL,
        stat: '10% Watched',
      },
      {
        name: 'its plays',
        props: MOVIE,
        url: HERETIC_COMMENTS_URL,
        stat: '1 play',
      },
    ] satisfies ReadonlyArray<
      { name: string; props: CommentsBlockProps; url: string; stat: string }
    >,
  )('should read the watched stat over $name', async ({ props, url, stat }) => {
    openAt(MOVIE_PATH);
    recordSearches(`${url}/likes`, [commentResponse({ id: 1 })]);
    renderBlock(props);

    const card = await screen.findByRole('article');

    expect(card.querySelector('.comment-footer')).toHaveTextContent(stat);
  });
  describe('spoiler auto-reveal', () => {
    it.each(
      [
        { name: 'a watched movie', props: MOVIE, url: HERETIC_COMMENTS_URL },
        {
          name: 'a watched episode',
          props: {
            target: SILO_EPISODE_COMMENTS_TARGET,
            media: SILO_EPISODE_ACTIONS_TARGET,
          },
          url: SILO_EPISODE_COMMENTS_URL,
        },
      ] satisfies ReadonlyArray<
        { name: string; props: CommentsBlockProps; url: string }
      >,
    )('should reveal a spoiler on $name', async ({ props, url }) => {
      openAt(MOVIE_PATH);
      recordSearches(`${url}/likes`, [
        commentResponse({ id: 1, variant: 'spoiler' }),
      ]);
      renderBlock(props);

      await waitFor(async () =>
        expect(await statesOf(1)).toEqual(['revealed'])
      );
    });

    it.each(
      [
        { name: 'a complete show', props: SHOW, url: SILO_COMMENTS_URL },
        {
          name: 'a complete season',
          props: {
            target: SILO_SEASON_COMMENTS_TARGET,
            media: SILO_SEASON_ACTIONS_TARGET,
          },
          url: SILO_SEASON_COMMENTS_URL,
        },
      ] satisfies ReadonlyArray<
        { name: string; props: CommentsBlockProps; url: string }
      >,
    )('should reveal a spoiler on $name', async ({ props, url }) => {
      openAt(MOVIE_PATH);
      recordSearches(`${url}/likes`, [
        commentResponse({ id: 1, variant: 'spoiler' }),
      ]);
      renderBlock({ ...props, progress: COMPLETE_PROGRESS });

      expect(await statesOf(1)).toEqual(['revealed']);
    });

    it.each(
      [
        {
          name: 'an incomplete progress',
          progress: { kind: 'ready', data: { completed: 11, total: 17 } },
        },
        { name: 'an empty progress', progress: { kind: 'empty' } },
        {
          name: 'a failed progress',
          progress: { kind: 'error', retry: () => undefined },
        },
        { name: 'no progress', progress: undefined },
      ] satisfies ReadonlyArray<
        { name: string; progress: CommentsBlockProps['progress'] }
      >,
    )(
      'should keep a spoiler concealed on a show with $name',
      async ({ progress }) => {
        openAt(MOVIE_PATH);
        recordSearches(`${SILO_COMMENTS_URL}/likes`, [
          commentResponse({ id: 1, variant: 'spoiler' }),
        ]);
        renderBlock({ ...SHOW, progress });

        await screen.findByRole('article');
        await waitNegativeClaim();

        expect(await statesOf(1)).toEqual(['concealed']);
      },
    );

    it('should reveal once a late progress comes in complete, leaving the focus where it was', async () => {
      openAt(MOVIE_PATH);
      recordSearches(`${SILO_COMMENTS_URL}/likes`, [
        commentResponse({ id: 1, variant: 'spoiler' }),
      ]);
      const { rerender } = renderBlock({
        ...SHOW,
        progress: { kind: 'loading' },
      });
      expect(await statesOf(1)).toEqual(['concealed']);
      const tab = screen.getByRole('tab', { selected: true });
      tab.focus();

      await rerender({ ...SHOW, progress: COMPLETE_PROGRESS });

      expect(await statesOf(1)).toEqual(['revealed']);
      expect(tab).toHaveFocus();
    });

    it('should treat every comment as a spoiler when the viewer hides comment spoilers', async () => {
      openAt(MOVIE_PATH);
      serveHiddenCommentSpoilers();
      serveNoWatchedMovies();
      recordSearches(LIKES_URL, [
        commentResponse({ id: 1 }),
        commentResponse({ id: 2, variant: 'spoiler' }),
      ]);
      const { userLoaded } = renderBlock();
      await userLoaded;

      await waitFor(async () =>
        expect(await statesOf(2)).toEqual(['concealed', 'concealed'])
      );
    });

    it('should reveal every comment on a watched Target, hidden comment spoilers or not', async () => {
      openAt(MOVIE_PATH);
      serveHiddenCommentSpoilers();
      recordSearches(LIKES_URL, [
        commentResponse({ id: 1 }),
        commentResponse({ id: 2, variant: 'spoiler' }),
      ]);
      const { userLoaded } = renderBlock();
      await userLoaded;

      await waitFor(async () =>
        expect(await statesOf(2)).toEqual(['revealed', 'revealed'])
      );
    });

    it('should treat a reply as a spoiler when the viewer hides comment spoilers', async () => {
      openAt(MOVIE_PATH);
      serveHiddenCommentSpoilers();
      serveNoWatchedMovies();
      recordSearches(LIKES_URL, [{
        ...commentResponse({ id: REPLIED_COMMENT_ID }),
        replies: 1,
      }]);
      recordSearches(REPLIED_COMMENT_REPLIES_URL, [
        commentResponse({ id: 2 }),
      ]);
      const { userLoaded } = renderBlock();
      await userLoaded;

      await userEvent.click(
        await screen.findByRole('button', { name: '1 reply' }),
      );

      await waitFor(async () =>
        expect(await statesOf(2)).toEqual(['concealed', 'concealed'])
      );
    });

    it('should reveal a spoiler reply on a watched Target', async () => {
      openAt(MOVIE_PATH);
      recordSearches(LIKES_URL, [{
        ...commentResponse({ id: REPLIED_COMMENT_ID }),
        replies: 1,
      }]);
      recordSearches(REPLIED_COMMENT_REPLIES_URL, [
        commentResponse({ id: 2, variant: 'spoiler' }),
      ]);
      renderBlock();

      await userEvent.click(
        await screen.findByRole('button', { name: '1 reply' }),
      );

      await waitFor(async () =>
        expect(await statesOf(2)).toEqual(['plain', 'revealed'])
      );
    });
  });
});
