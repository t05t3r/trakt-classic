import { HERETIC_COMMENTS_TARGET } from '$mocks/data/comments/HERETIC_COMMENTS_TARGET.ts';
import { SILO_COMMENTS_TARGET } from '$mocks/data/comments/SILO_COMMENTS_TARGET.ts';
import { SILO_SEASON_COMMENTS_TARGET } from '$mocks/data/comments/SILO_SEASON_COMMENTS_TARGET.ts';
import { goto } from '$app/navigation';
import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import { HERETIC_COMMENTS_URL } from '$mocks/data/movies/HERETIC_COMMENTS_URL.ts';
import { SILO_COMMENTS_URL } from '$mocks/data/shows/SILO_COMMENTS_URL.ts';
import { SILO_EPISODE_COMMENTS_URL } from '$mocks/data/shows/SILO_EPISODE_COMMENTS_URL.ts';
import { SILO_EPISODE_COMMENTS_TARGET } from '$mocks/data/comments/SILO_EPISODE_COMMENTS_TARGET.ts';
import { SILO_SEASON_COMMENTS_URL } from '$mocks/data/shows/SILO_SEASON_COMMENTS_URL.ts';
import { time } from '$lib/utils/timing/time.ts';
import { server } from '$mocks/server.ts';
import { ageLoadedData } from '$test/beds/query/ageLoadedData.ts';
import { kindsOf } from '$test/beds/query/kindsOf.ts';
import { idsOf } from '$test/beds/store/idsOf.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { commentPage } from '$test/beds/request/commentPage.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { collectDistinctStates } from '$test/beds/store/collectDistinctStates.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { followReplaces } from '$test/beds/url/followReplaces.svelte.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { http } from 'msw';
import { filter, firstValueFrom, map, type Observable } from 'rxjs';
import { describe, expect, it } from 'vitest';
import type { CommentsReveal } from '../_internal/revealComments.ts';
import { type CommentsTarget, useComments } from './useComments.ts';

const MOVIE_PATH = '/movies/heretic-2024';
const LIKES_URL = `${HERETIC_COMMENTS_URL}/likes`;
const NEWEST_URL = `${HERETIC_COMMENTS_URL}/newest`;

type CommentsStatus = SectionStatus<CommentsReveal>;
type Ready = Extract<CommentsStatus, { kind: 'ready' }>;

function ids(from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

function serveLikes(
  second: () => Response | Promise<Response> = () =>
    pagedResponse({ body: commentPage({ page: 2 }), page: 2, pageCount: 2 }),
) {
  serveTwoPages({ url: LIKES_URL, first: commentPage({ page: 1 }), second });
}

async function readComments(target: CommentsTarget = HERETIC_COMMENTS_TARGET) {
  const store = await renderStore(() => ({
    ...useComments(target),
    waitForLateRequests: useWaitForLateRequests(),
  }));
  // Holds the pane open, as a mounted block would.
  return { ...store, kinds: kindsOf(store.status) };
}

function toIds({ comments, ...flags }: CommentsReveal) {
  return { ids: idsOf(comments), ...flags };
}

// Resolves once the pane shows `count` comments, to their ids and flags.
async function revealed(status: Observable<CommentsStatus>, count: number) {
  const { data } = await firstValueFrom(
    status.pipe(
      filter((read): read is Ready =>
        read.kind === 'ready' && read.data.comments.length === count
      ),
    ),
  );
  return toIds(data);
}

describe('store: useComments', () => {
  it("should show Likes All Time's first three with more", async () => {
    openAt(MOVIE_PATH);
    serveLikes();
    const { status } = await readComments();

    expect(await revealed(status, 3)).toEqual({
      ids: [1, 2, 3],
      showMore: true,
      showLess: false,
    });
  });

  it('should reveal the rest of page one, then page two, and less back to three', async () => {
    openAt(MOVIE_PATH);
    serveLikes();
    const { status, more, less } = await readComments();
    await revealed(status, 3);

    more();
    const restOfPageOne = await revealed(status, 10);
    more();
    const pageTwo = await revealed(status, 20);
    less();

    expect(restOfPageOne).toEqual({
      ids: ids(1, 10),
      showMore: true,
      showLess: true,
    });
    expect(pageTwo).toEqual({
      ids: ids(1, 20),
      showMore: false,
      showLess: true,
    });
    expect(await revealed(status, 3)).toEqual({
      ids: [1, 2, 3],
      showMore: true,
      showLess: false,
    });
  });

  it('should reveal the rest of page one with no request', async () => {
    openAt(MOVIE_PATH);
    serveLikes();
    const { status, more, waitForLateRequests } = await readComments();
    await revealed(status, 3);

    const requests = await captureRequests(async () => {
      more();
      await revealed(status, 10);
      await waitForLateRequests();
    });

    expect(requests).toEqual([]);
  });

  it('should reveal the loaded pages again after less with no request', async () => {
    openAt(MOVIE_PATH);
    serveLikes();
    const { status, more, less, waitForLateRequests } = await readComments();
    await revealed(status, 3);
    more();
    more();
    await revealed(status, 20);
    less();
    await revealed(status, 3);

    const requests = await captureRequests(async () => {
      more();
      await revealed(status, 10);
      more();
      await revealed(status, 20);
      await waitForLateRequests();
    });

    expect(requests).toEqual([]);
  });

  it.each([
    { search: '', sort: 'likes' },
    { search: '?comments=recent', sort: 'newest' },
    { search: '?comments=likes', sort: 'likes' },
  ])('should read $search as $sort', async ({ search, sort }) => {
    openAt(`${MOVIE_PATH}${search}`);
    const { sort: reading } = await readComments();

    expect(await readKnown(reading)).toBe(sort);
  });

  it('should put Recent in the URL with one replace that keeps the rest', async () => {
    openAt(`${MOVIE_PATH}?fade=watched#comments`);
    const { select } = await readComments();

    await select('newest');

    expect(goto).toHaveBeenCalledExactlyOnceWith(
      expect.any(URL),
      expect.objectContaining({ replaceState: true }),
    );
    expect(lastReplace()).toBe(
      `${MOVIE_PATH}?fade=watched&comments=recent#comments`,
    );
  });

  it('should take the tab out of the URL when Likes All Time is chosen', async () => {
    openAt(`${MOVIE_PATH}?comments=recent&fade=watched`);
    const { select } = await readComments();

    await select('likes');

    expect(lastReplace()).toBe(`${MOVIE_PATH}?fade=watched`);
  });

  it.each(
    [
      { target: HERETIC_COMMENTS_TARGET, url: HERETIC_COMMENTS_URL },
      { target: SILO_COMMENTS_TARGET, url: SILO_COMMENTS_URL },
      {
        target: SILO_SEASON_COMMENTS_TARGET,
        url: SILO_SEASON_COMMENTS_URL,
      },
      {
        target: SILO_EPISODE_COMMENTS_TARGET,
        url: SILO_EPISODE_COMMENTS_URL,
      },
    ] as const,
  )(
    "should read a $target.type's first page of ten from its own route",
    async ({ target, url }) => {
      openAt(MOVIE_PATH);
      const searches = recordSearches(`${url}/likes`, commentPage({ page: 1 }));
      const { status } = await readComments(target);

      await nextOf(status, 'ready');

      expect(searches.map((search) => Object.fromEntries(search))).toEqual([
        { extended: 'images', limit: '10', page: '1' },
      ]);
    },
  );

  it('should read Recent from its own route and leave Likes All Time unasked', async () => {
    openAt(`${MOVIE_PATH}?comments=recent`);
    const likes = recordSearches(LIKES_URL, commentPage({ page: 1 }));
    const newest = recordSearches(NEWEST_URL, commentPage({ page: 1 }));
    const { status, waitForLateRequests } = await readComments();

    await nextOf(status, 'ready');
    await waitForLateRequests();

    expect(newest).toHaveLength(1);
    expect(likes).toEqual([]);
  });

  it('should send no request for the hidden Recent pane', async () => {
    openAt(MOVIE_PATH);
    serveLikes();
    const newest = recordSearches(NEWEST_URL, commentPage({ page: 1 }));
    const { status, waitForLateRequests } = await readComments();

    await nextOf(status, 'ready');
    await waitForLateRequests();

    expect(newest).toEqual([]);
  });

  it('should open each tab at three, its own first page', async () => {
    followReplaces(MOVIE_PATH);
    serveLikes();
    recordSearches(NEWEST_URL, commentPage({ page: 3 }));
    const { sort, status, more, select } = await readComments();
    await revealed(status, 3);
    more();
    await revealed(status, 10);

    await select('newest');
    await firstValueFrom(sort.pipe(filter((key) => key === 'newest')));
    const recent = await revealed(status, 3);
    await select('likes');
    await firstValueFrom(sort.pipe(filter((key) => key === 'likes')));

    expect(recent.ids).toEqual([21, 22, 23]);
    expect(await revealed(status, 3)).toEqual({
      ids: [1, 2, 3],
      showMore: true,
      showLess: false,
    });
  });

  it('should show none of the old tab after a tab switch', async () => {
    followReplaces(MOVIE_PATH);
    serveLikes();
    recordSearches(NEWEST_URL, commentPage({ page: 3 }));
    const { status, more, select } = await readComments();
    await revealed(status, 3);
    more();
    await revealed(status, 10);
    const shown = collectDistinctStates(
      status.pipe(
        map((read) =>
          read.kind === 'ready' ? idsOf(read.data.comments) : read.kind
        ),
      ),
    );
    const before = shown.length;

    await select('newest');
    await firstValueFrom(
      status.pipe(
        filter((read) =>
          read.kind === 'ready' && read.data.comments.at(0)?.id === 21
        ),
      ),
    );

    expect(shown.slice(before)).toEqual(['loading', [21, 22, 23]]);
  });

  it('should reveal page two on the first more when page one holds three', async () => {
    openAt(MOVIE_PATH);
    serveTwoPages({
      url: LIKES_URL,
      first: commentPage({ page: 1, count: 3 }),
      second: () =>
        pagedResponse({
          body: commentPage({ page: 2 }),
          page: 2,
          pageCount: 2,
        }),
    });
    const { status, more } = await readComments();
    await revealed(status, 3);

    more();

    expect((await revealed(status, 13)).ids).toEqual([1, 2, 3, ...ids(11, 20)]);
  });

  it('should drop a comment page two repeats from page one', async () => {
    openAt(MOVIE_PATH);
    serveLikes(() =>
      pagedResponse({
        body: [
          ...commentPage({ page: 1 }).slice(-2),
          ...commentPage({ page: 2, count: 8 }),
        ],
        page: 2,
        pageCount: 2,
      })
    );
    const { status, more } = await readComments();
    await revealed(status, 3);

    more();
    more();

    expect((await revealed(status, 18)).ids).toEqual(ids(1, 18));
  });

  it('should send only page two for a more on data loaded 31 s ago', async () => {
    openAt(MOVIE_PATH);
    const searches = recordSearches(LIKES_URL, commentPage({ page: 1 }));
    const { status, more, waitForLateRequests } = await readComments();
    await revealed(status, 3);
    ageLoadedData();

    more();
    await revealed(status, 10);
    more();
    await waitForLateRequests();

    expect(searches.map((search) => search.get('page'))).toEqual(['1', '2']);
  });

  it('should fetch page two once for mores pressed while the loaded pages refetch', async () => {
    openAt(MOVIE_PATH);
    serveLikes();
    const { first, second, waitForLateRequests } = await renderStore(() => ({
      first: useComments(HERETIC_COMMENTS_TARGET),
      second: useComments(HERETIC_COMMENTS_TARGET),
      waitForLateRequests: useWaitForLateRequests(),
    }));
    await revealed(first.status, 3);
    first.more();
    await revealed(first.status, 10);
    const refetch = holdRequest({ method: 'get', url: LIKES_URL });
    ageLoadedData(time.minutes(31));
    // A mount on data past its 30 min TTL refetches the loaded page.
    kindsOf(second.status);
    await refetch.requested;

    const requests = await captureRequests(async () => {
      first.more();
      first.more();
      refetch.release();
      await revealed(first.status, 20);
      await waitForLateRequests();
    });

    expect(requests).toEqual([`GET ${new URL(LIKES_URL).pathname}`]);
  });

  it('should send one request for page two when more is pressed again while it loads', async () => {
    openAt(MOVIE_PATH);
    const pageTwo = holdResponse(() =>
      pagedResponse({ body: commentPage({ page: 2 }), page: 2, pageCount: 2 })
    );
    serveLikes(pageTwo.answer);
    const { status, more, waitForLateRequests } = await readComments();
    await revealed(status, 3);
    more();
    await revealed(status, 10);

    const requests = await captureRequests(async () => {
      more();
      await pageTwo.requested;
      more();
      pageTwo.release();
      await revealed(status, 20);
      await waitForLateRequests();
    });

    expect(requests).toEqual([`GET ${new URL(LIKES_URL).pathname}`]);
  });

  it('should read a failed page two as ready with more, and fetch it on the next more', async () => {
    openAt(MOVIE_PATH);
    serveLikes(notFound);
    const { status, more, waitForLateRequests } = await readComments();
    await revealed(status, 3);
    more();
    more();
    await waitForLateRequests();
    const failed = await revealed(status, 10);

    serveLikes();
    more();

    expect(failed).toEqual({
      ids: ids(1, 10),
      showMore: true,
      showLess: true,
    });
    expect((await revealed(status, 20)).ids).toEqual(ids(1, 20));
  });

  it('should send no second request for a failed page two, and load it on the next more', async () => {
    openAt(MOVIE_PATH);
    serveLikes(notFound);
    const { status, more, waitForLateRequests } = await readComments();
    await revealed(status, 3);
    more();
    await revealed(status, 10);

    const failed = await captureRequests(async () => {
      more();
      await waitForLateRequests();
    });
    serveLikes();
    const retried = await captureRequests(async () => {
      more();
      await revealed(status, 20);
    });

    expect(failed).toEqual([`GET ${new URL(LIKES_URL).pathname}`]);
    expect(retried).toEqual([`GET ${new URL(LIKES_URL).pathname}`]);
    expect((await revealed(status, 20)).ids).toEqual(ids(1, 20));
  });

  it('should open at three after a more pressed while page one loads', async () => {
    openAt(MOVIE_PATH);
    const pageOne = holdResponse(() =>
      pagedResponse({ body: commentPage({ page: 1 }), pageCount: 2 })
    );
    server.use(http.get(LIKES_URL, pageOne.answer));
    const { status, more } = await readComments();
    await pageOne.requested;

    more();
    pageOne.release();

    expect(toIds((await nextOf(status, 'ready')).data)).toEqual({
      ids: [1, 2, 3],
      showMore: true,
      showLess: false,
    });
  });

  it('should read an empty pane as empty', async () => {
    openAt(MOVIE_PATH);
    recordSearches(LIKES_URL, []);
    const { status } = await readComments();

    expect(await nextOf(status, 'empty')).toEqual({ kind: 'empty' });
  });

  it('should read a failed pane as an error whose retry loads it', async () => {
    openAt(MOVIE_PATH);
    server.use(http.get(LIKES_URL, notFound));
    const { status, kinds } = await readComments();
    const failed = await nextOf(status, 'error');

    serveLikes();
    failed.retry();
    await revealed(status, 3);

    expect(kinds).toEqual(['loading', 'error', 'loading', 'ready']);
  });
});
