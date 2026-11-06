import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { EpisodeActivityHistoryMappedMock } from '$mocks/data/users/mapped/EpisodeActivityHistoryMappedMock.ts';

export const EPISODE_PLAY = assertDefined(
  EpisodeActivityHistoryMappedMock.at(0),
);
