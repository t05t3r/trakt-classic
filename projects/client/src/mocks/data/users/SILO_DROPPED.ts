import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import type { HiddenShowItemResponse } from '@trakt/api';

// Dropped before Devs, so the Dropped Date order differs from the Watched Date one.
export const SILO_DROPPED: HiddenShowItemResponse = {
  hidden_at: '2023-06-01T12:00:00.000Z',
  type: 'show',
  show: ShowSiloResponseMock,
};
