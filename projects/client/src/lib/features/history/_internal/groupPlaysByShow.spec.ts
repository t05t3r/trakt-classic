import type { EpisodeActivityHistory } from '$lib/requests/queries/users/episodeActivityHistoryQuery.ts';
import { ShowDevsMappedMock } from '$mocks/data/summary/shows/devs/ShowDevsMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { EPISODE_PLAY } from '$mocks/data/users/EPISODE_PLAY.ts';
import { describe, expect, it } from 'vitest';
import { groupPlaysByShow } from './groupPlaysByShow.ts';

const LATEST = new Date('2025-01-31T23:12:41.000Z');
const LATER = new Date('2025-01-30T20:00:00.000Z');
const EARLIEST = new Date('2025-01-02T08:30:00.000Z');

function playOf(
  show: EpisodeActivityHistory['show'],
  watchedAt: Date,
): EpisodeActivityHistory {
  return { ...EPISODE_PLAY, show, watchedAt };
}

describe('util: groupPlaysByShow', () => {
  it('should read no plays as no shows', () => {
    expect(groupPlaysByShow([])).toEqual([]);
  });

  it('should map a play to its show, keyed and dated, with no history id', () => {
    const groups = groupPlaysByShow([playOf(ShowSiloMappedMock, LATEST)]);

    expect(groups).toEqual([{
      type: 'show',
      key: ShowSiloMappedMock.key,
      watchedAt: LATEST,
      show: ShowSiloMappedMock,
    }]);
    expect(groups.at(0)).not.toHaveProperty('id');
  });

  it('should order the shows by their first appearance', () => {
    const groups = groupPlaysByShow([
      playOf(ShowDevsMappedMock, LATEST),
      playOf(ShowSiloMappedMock, LATER),
      playOf(ShowDevsMappedMock, EARLIEST),
    ]);

    expect(groups.map(({ show }) => show.title)).toEqual(['Devs', 'Silo']);
  });

  it("should date a show by its latest play, the page's first of it", () => {
    const groups = groupPlaysByShow([
      playOf(ShowSiloMappedMock, LATEST),
      playOf(ShowDevsMappedMock, LATER),
      playOf(ShowSiloMappedMock, EARLIEST),
    ]);

    expect(groups.map(({ watchedAt }) => watchedAt)).toEqual([LATEST, LATER]);
  });
});
