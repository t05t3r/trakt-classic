import type { WatchedShowProgress } from '$lib/requests/queries/sync/watchedShowsProgressQuery.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { DEVS_WATCHED_PROGRESS } from '$mocks/data/sync/DEVS_WATCHED_PROGRESS.ts';
import { fixNow } from '$test/beds/date/fixNow.ts';
import { emulateHydrated } from '$test/beds/hydration/emulateHydrated.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import LastWatchedPill from './LastWatchedPill.svelte';

const LAST_EPISODE = assertDefined(DEVS_WATCHED_PROGRESS.lastEpisode);

function renderPill(row: WatchedShowProgress = DEVS_WATCHED_PROGRESS) {
  render(LastWatchedPill, {
    props: { row, lastWatchedAt: row.lastWatchedAt },
  });
}

const pill = () => screen.getByRole('link');

describe('component: LastWatchedPill', () => {
  it('should link to the last episode watched, its sxe in bold, its time left for the hydrated page', () => {
    renderPill();

    expect(pill()).toHaveTextContent(/^Last watched 1x05 "Episode 5"$/);
    expect(pill()).toHaveAttribute('href', '/shows/devs/seasons/1/episodes/5');
    expect(pill().querySelector('strong')).toHaveTextContent(/^1x05$/);
  });

  it('should name the episode by its absolute number too, where it has one', () => {
    renderPill({
      ...DEVS_WATCHED_PROGRESS,
      lastEpisode: { ...LAST_EPISODE, numberAbs: 5 },
    });

    expect(pill()).toHaveTextContent(/^Last watched 1x05 \(5\) "Episode 5"$/);
  });

  it('should name an episode with no title by its number alone', () => {
    renderPill({
      ...DEVS_WATCHED_PROGRESS,
      lastEpisode: { ...LAST_EPISODE, title: '' },
    });

    expect(pill()).toHaveTextContent(/^Last watched 1x05$/);
  });

  it('should tell how long ago it was watched, once the page has hydrated', async () => {
    fixNow(new Date('2025-01-21T07:04:00.000Z'));
    renderPill();

    emulateHydrated();

    await waitFor(() =>
      expect(pill()).toHaveTextContent(
        /^Last watched 1x05 "Episode 5" 10 hours ago$/,
      )
    );
  });

  it('should draw nothing for a show never played', async () => {
    renderPill({
      ...DEVS_WATCHED_PROGRESS,
      completed: 0,
      plays: 0,
    });

    emulateHydrated();
    await waitNegativeClaim();

    expect(screen.queryByRole('link')).toBeNull();
  });
});
