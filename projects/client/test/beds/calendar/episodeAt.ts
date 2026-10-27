import type { CalendarEntry } from '$lib/requests/models/CalendarEntry.ts';
import { EpisodeSiloMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';

export function episodeAt(
  id: number,
  airsAt: string,
): Extract<CalendarEntry, { kind: 'episode' }> {
  return {
    kind: 'episode',
    show: ShowSiloMappedMock,
    episode: { ...EpisodeSiloMappedMock, id, key: `episode-${id}` },
    airsAt: new Date(airsAt),
  };
}
