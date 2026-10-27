import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { ShowSiloSeasonEpisodesResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonEpisodesResponseMock.ts';
import { ShowSiloSeasonsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsResponseMock.ts';
import { ActivityHistoryResponseMock } from '$mocks/data/users/response/ActivityHistoryResponseMock.ts';

const seasonKey = (index: number) => {
  const { ids, number } = assertDefined(ShowSiloSeasonsResponseMock.at(index));
  return `${ids.trakt}|${number}`;
};

const episodeId = (number: number) =>
  assertDefined(
    ShowSiloSeasonEpisodesResponseMock.find((entry) => entry.number === number),
  ).ids.trakt;

// The activity history's play of Silo 1x01.
const episodePlay = assertDefined(
  ActivityHistoryResponseMock.find((play) => play.type === 'episode'),
).watched_at;

export const WatchedShowsSiloResponseMock = {
  [ShowSiloResponseMock.ids.trakt]: {
    [seasonKey(0)]: {
      [episodeId(1)]: [episodePlay],
      [episodeId(2)]: ['2025-03-10T20:00:00.000Z', '2025-02-10T20:00:00.000Z'],
    },
    [seasonKey(1)]: { '1': ['2025-05-10T20:00:00.000Z'] },
  },
};
