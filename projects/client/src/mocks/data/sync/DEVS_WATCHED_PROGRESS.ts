import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { WatchedProgressMappedMock } from '$mocks/data/sync/mapped/WatchedProgressMappedMock.ts';

// Devs, 5 of 8 aired episodes watched over 5 plays, the last one 1x05 and the next 1x06.
export const DEVS_WATCHED_PROGRESS = assertDefined(
  WatchedProgressMappedMock.at(0),
);
