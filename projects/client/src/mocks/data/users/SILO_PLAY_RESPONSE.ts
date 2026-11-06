import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { ShowActivityHistoryResponseMock } from '$mocks/data/users/response/ShowActivityHistoryResponseMock.ts';

export const SILO_PLAY_RESPONSE = assertDefined(
  ShowActivityHistoryResponseMock.at(0),
);
