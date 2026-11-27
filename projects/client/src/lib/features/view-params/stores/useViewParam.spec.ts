import { goto } from '$app/navigation';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { dispatchPageShow } from '$test/beds/url/dispatchPageShow.ts';
import { holdFirstNavigation } from '$test/beds/url/holdFirstNavigation.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { reloadFirstNavigation } from '$test/beds/url/reloadFirstNavigation.ts';
import { startNavigation } from '$test/beds/url/startNavigation.ts';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { useViewParam } from './useViewParam.ts';

const SPEC = {
  actors: { values: ['regular', 'guest'], fallback: 'regular' },
  comments: { values: ['likes', 'recent'], fallback: null },
};

const PREDICATE_SPEC = {
  season: {
    values: (value: string) => /^[1-9]$/.test(value),
    fallback: null,
  },
};

function renderViewParam() {
  return renderStore(() => useViewParam(SPEC));
}

function holdReplaces() {
  const held = Promise.withResolvers<void>();
  vi.mocked(goto).mockImplementation(() => held.promise);
  onTestFinished(() => {
    held.resolve();
    vi.mocked(goto).mockReset();
  });
  return held;
}

describe('store: useViewParam', () => {
  it('should read each key from the URL', async () => {
    openAt('/movies/heretic-2024?actors=guest&comments=recent');
    const { values } = await renderViewParam();

    expect(await readKnown(values)).toEqual({
      actors: 'guest',
      comments: 'recent',
    });
  });

  it('should read a missing key as its fallback', async () => {
    openAt('/movies/heretic-2024');
    const { values } = await renderViewParam();

    expect(await readKnown(values)).toEqual({
      actors: 'regular',
      comments: null,
    });
  });

  it('should read an unknown value as its fallback', async () => {
    openAt('/movies/heretic-2024?actors=crew&comments=oldest');
    const { values } = await renderViewParam();

    expect(await readKnown(values)).toEqual({
      actors: 'regular',
      comments: null,
    });
  });

  describe('with a predicate for its values', () => {
    it.each([
      { search: '?season=3', season: '3' },
      { search: '?season=0', season: null },
      { search: '?season=12', season: null },
      { search: '', season: null },
    ])('should read $search as $season', async ({ search, season }) => {
      openAt(`/shows/silo${search}`);
      const { values } = await renderStore(() => useViewParam(PREDICATE_SPEC));

      expect(await readKnown(values)).toEqual({ season });
    });

    it('should write a value its predicate accepts', async () => {
      openAt('/shows/silo');
      const { set } = await renderStore(() => useViewParam(PREDICATE_SPEC));

      await set({ season: '4' });

      expect(lastReplace()).toBe('/shows/silo?season=4');
    });
  });

  it('should replace the URL and keep the focus and the scroll', async () => {
    openAt('/movies/heretic-2024');
    const { set } = await renderViewParam();

    await set({ actors: 'guest' });

    expect(goto).toHaveBeenCalledExactlyOnceWith(expect.any(URL), {
      replaceState: true,
      noScroll: true,
      keepFocus: true,
    });
    expect(lastReplace()).toBe('/movies/heretic-2024?actors=guest');
  });

  it('should omit a key set to its fallback', async () => {
    openAt('/movies/heretic-2024?actors=guest&comments=recent');
    const { set } = await renderViewParam();

    await set({ actors: 'regular', comments: null });

    expect(lastReplace()).toBe('/movies/heretic-2024');
  });

  it('should write several keys in one replace', async () => {
    openAt('/movies/heretic-2024');
    const { set } = await renderViewParam();

    await set({ actors: 'guest', comments: 'likes' });

    expect(goto).toHaveBeenCalledOnce();
    expect(lastReplace()).toBe(
      '/movies/heretic-2024?actors=guest&comments=likes',
    );
  });

  it('should keep the other params and the hash', async () => {
    openAt('/movies/heretic-2024?page=2#comments');
    const { set } = await renderViewParam();

    await set({ actors: 'guest' });

    expect(lastReplace()).toBe(
      '/movies/heretic-2024?page=2&actors=guest#comments',
    );
  });

  it('should write a comma in a value as a literal comma', async () => {
    openAt('/shows/silo?page=2');
    const { set } = await renderStore(() =>
      useViewParam({
        seasons: { values: ['rating,desc'], fallback: null },
      })
    );

    await set({ seasons: 'rating,desc' });

    expect(lastReplace()).toBe('/shows/silo?page=2&seasons=rating,desc');
  });

  it('should keep both keys of two quick sets', async () => {
    openAt('/movies/heretic-2024');
    const { set } = await renderViewParam();

    await Promise.all([set({ actors: 'guest' }), set({ comments: 'likes' })]);

    expect(goto).toHaveBeenCalledOnce();
    expect(lastReplace()).toBe(
      '/movies/heretic-2024?actors=guest&comments=likes',
    );
  });

  it('should drop a queued set once the pathname has changed', async () => {
    const held = holdReplaces();
    openAt('/movies/heretic-2024');
    const { set } = await renderViewParam();

    const first = set({ actors: 'guest' });
    await vi.waitFor(() => expect(goto).toHaveBeenCalledOnce());
    const sets = Promise.all([first, set({ comments: 'likes' })]);
    openAt('/shows/silo?q=a%20b&flag');
    held.resolve();
    await sets;

    expect(goto).toHaveBeenCalledOnce();
    expect(lastReplace()).toBe('/movies/heretic-2024?actors=guest');
  });

  it('should replace a queued set by a set made on another page', async () => {
    const held = holdReplaces();
    openAt('/movies/heretic-2024');
    const { set } = await renderViewParam();

    const first = set({ actors: 'guest' });
    await vi.waitFor(() => expect(goto).toHaveBeenCalledOnce());
    const queued = set({ comments: 'likes' });
    openAt('/shows/silo');
    const sets = Promise.all([first, queued, set({ actors: 'guest' })]);
    held.resolve();
    await sets;

    expect(goto).toHaveBeenCalledTimes(2);
    expect(lastReplace()).toBe('/shows/silo?actors=guest');
  });

  it('should run a set made during a navigation once it lands', async () => {
    openAt('/movies/heretic-2024');
    const { set } = await renderViewParam();
    const navigation = startNavigation();

    const queued = set({ actors: 'guest' });
    await waitNegativeClaim();
    const beforeLanding = vi.mocked(goto).mock.calls.length;
    navigation.land();
    await queued;

    expect(beforeLanding).toBe(0);
    expect(lastReplace()).toBe('/movies/heretic-2024?actors=guest');
  });

  it('should run the sets made while a replace reloads the page once a bfcache restore brings it back', async () => {
    openAt('/movies/heretic-2024');
    const { set } = await renderViewParam();
    const unloading = reloadFirstNavigation();

    void set({ comments: 'recent' });
    await unloading;
    const queued = set({ actors: 'guest' });
    dispatchPageShow({ persisted: true });
    await queued;
    const restored = lastReplace();
    await set({ comments: 'likes' });

    expect(restored).toBe('/movies/heretic-2024?actors=guest');
    expect(lastReplace()).toBe('/movies/heretic-2024?comments=likes');
  });

  it('should drop a set made during a navigation that lands on another pathname', async () => {
    openAt('/movies/heretic-2024');
    const { set } = await renderViewParam();
    const navigation = startNavigation();

    const queued = set({ actors: 'guest' });
    openAt('/shows/silo');
    navigation.land();
    await queued;

    expect(goto).not.toHaveBeenCalled();
  });

  it('should merge a burst of sets behind a replace into one replace', async () => {
    const held = holdFirstNavigation();
    openAt('/movies/heretic-2024');
    const { set } = await renderViewParam();

    const first = set({ actors: 'guest' });
    await vi.waitFor(() => expect(goto).toHaveBeenCalledOnce());
    const burst = Promise.all([
      set({ actors: 'regular' }),
      set({ comments: 'likes' }),
      set({ actors: 'guest' }),
      set({ comments: 'recent' }),
    ]);
    await waitNegativeClaim();
    expect(goto).toHaveBeenCalledOnce();
    held.resolve();
    await Promise.all([first, burst]);

    expect(goto).toHaveBeenCalledTimes(2);
    expect(lastReplace()).toBe(
      '/movies/heretic-2024?actors=guest&comments=recent',
    );
  });

  it('should keep a queued key that a later set leaves undefined', async () => {
    const held = holdFirstNavigation();
    openAt('/movies/heretic-2024');
    const { set } = await renderViewParam();

    const first = set({ actors: 'guest' });
    await vi.waitFor(() => expect(goto).toHaveBeenCalledOnce());
    const burst = Promise.all([
      set({ comments: 'likes' }),
      set({ actors: 'regular', comments: undefined }),
    ]);
    held.resolve();
    await Promise.all([first, burst]);

    expect(goto).toHaveBeenCalledTimes(2);
    expect(lastReplace()).toBe('/movies/heretic-2024?comments=likes');
  });

  it("should omit each queued key set to its own hook's fallback", async () => {
    const held = holdFirstNavigation();
    openAt('/shows/silo?seasons=rating,desc');
    const { cast, seasons } = await renderStore(() => ({
      cast: useViewParam(SPEC),
      seasons: useViewParam({
        seasons: {
          values: ['rating,desc', 'number,asc'],
          fallback: 'number,asc',
        },
      }),
    }));

    const first = cast.set({ comments: 'likes' });
    await vi.waitFor(() => expect(goto).toHaveBeenCalledOnce());
    const burst = Promise.all([
      seasons.set({ seasons: 'number,asc' }),
      cast.set({ actors: 'guest' }),
    ]);
    held.resolve();
    await Promise.all([first, burst]);

    expect(goto).toHaveBeenCalledTimes(2);
    expect(lastReplace()).toBe('/shows/silo?comments=likes&actors=guest');
  });

  it('should hand an updater the values the sets before it leave', async () => {
    const held = holdFirstNavigation();
    openAt('/movies/heretic-2024');
    const { set } = await renderViewParam();

    const first = set({ actors: 'guest' });
    await vi.waitFor(() => expect(goto).toHaveBeenCalledOnce());
    const burst = Promise.all([
      set({ comments: 'likes' }),
      set(({ actors, comments }) => ({
        actors: actors === 'guest' ? 'regular' : 'guest',
        comments: comments === 'likes' ? 'recent' : 'likes',
      })),
    ]);
    held.resolve();
    await Promise.all([first, burst]);

    expect(goto).toHaveBeenCalledTimes(2);
    expect(lastReplace()).toBe('/movies/heretic-2024?comments=recent');
  });

  it('should hand an updater the values the URL held at the call', async () => {
    openAt('/movies/heretic-2024?actors=guest');
    const { set } = await renderViewParam();
    const navigation = startNavigation();

    const queued = set((values, made) =>
      values.actors === made.actors ? {} : { comments: made.actors }
    );
    openAt('/movies/heretic-2024?comments=likes');
    navigation.land();
    await queued;

    expect(lastReplace()).toBe('/movies/heretic-2024?comments=guest');
  });

  it('should not replace a URL that a set leaves unchanged', async () => {
    openAt('/movies/heretic-2024?actors=guest');
    const { set } = await renderViewParam();

    await set({ actors: 'guest', comments: null });

    expect(goto).not.toHaveBeenCalled();
  });

  it('should not replace a URL written in another form that a set leaves unchanged', async () => {
    openAt('/shows/silo?seasons=rating%2Cdesc&q=a%20b&flag');
    const { set } = await renderStore(() =>
      useViewParam({
        seasons: { values: ['rating,desc'], fallback: null },
        actors: { values: ['guest'], fallback: 'regular' },
      })
    );

    await set({ seasons: 'rating,desc', actors: 'regular' });

    expect(goto).not.toHaveBeenCalled();
  });

  it('should resolve when the replace fails', async () => {
    vi.mocked(goto).mockRejectedValueOnce(new Error('navigation cancelled'));
    openAt('/movies/heretic-2024');
    const { set } = await renderViewParam();

    await expect(set({ actors: 'guest' })).resolves.toBeUndefined();
  });
});
