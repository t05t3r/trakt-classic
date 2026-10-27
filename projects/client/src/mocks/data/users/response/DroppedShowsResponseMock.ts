import { ShowDevsResponseMock } from '$mocks/data/summary/shows/devs/ShowDevsResponseMock.ts';
import type { HiddenShowItemResponse } from '@trakt/api';

export const DroppedShowsResponseMock: HiddenShowItemResponse[] = [
  {
    'hidden_at': '2024-02-01T12:00:00.000Z',
    'type': 'show',
    'show': ShowDevsResponseMock,
  },
];
