import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { DroppedShowsResponseMock } from '$mocks/data/users/response/DroppedShowsResponseMock.ts';

export const DROPPED_AT = new Date(
  assertDefined(DroppedShowsResponseMock.at(0)?.hidden_at),
);
