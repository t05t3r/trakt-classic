import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { mapToEpisodeEntry } from '$lib/requests/_internal/mapToEpisodeEntry.ts';
import { mapToShowEntry } from '$lib/requests/_internal/mapToShowEntry.ts';
import { mapToShowProgress } from '$lib/requests/_internal/mapToShowProgress.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import {
  type UpNextEntry,
  UpNextEntrySchema,
} from '$lib/requests/models/UpNextEntry.ts';
import { time } from '$lib/utils/timing/time.ts';
import type { UpNextResponse } from '@trakt/api';

// Enough for three rows of six; the section never asks for a second page.
const UP_NEXT_LIMIT = 18;

function mapToUpNextEntry(item: UpNextResponse): UpNextEntry {
  const show = mapToShowEntry(item.show);
  const episode = mapToEpisodeEntry(item.progress.next_episode);

  return {
    show,
    ...episode,
    runtime: Number.isNaN(episode.runtime) ? show.runtime : episode.runtime,
    ...mapToShowProgress(item.progress),
  };
}

const upNextRequest = ({ fetch }: ApiParams) =>
  api({ fetch })
    .sync
    .progress
    .upNext
    .standard({
      query: {
        sort_by: 'activity',
        sort_how: 'desc',
        extended: 'full,images',
        limit: UP_NEXT_LIMIT,
        page: 1,
      },
    });

export const upNextQuery = defineQuery({
  key: 'upNext',
  invalidations: [
    InvalidateAction.MarkAsWatched('show'),
    InvalidateAction.MarkAsWatched('episode'),
    InvalidateAction.Drop('show'),
    InvalidateAction.Restore,
    InvalidateAction.Watchlisted('show'),
    InvalidateAction.Watchlisted('season'),
  ],
  dependencies: [],
  request: upNextRequest,
  mapper: (response) =>
    response.body
      .filter((item) => item.progress.next_episode != null)
      .map(mapToUpNextEntry),
  schema: UpNextEntrySchema.array(),
  ttl: time.minutes(15),
  refetchOnWindowFocus: true,
});
