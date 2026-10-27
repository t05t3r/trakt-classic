import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
import { ShowDevsMappedMock } from '$mocks/data/summary/shows/devs/ShowDevsMappedMock.ts';

export const ShowSiloRelatedMappedMock: ShowEntry[] = [
  {
    ...ShowDevsMappedMock,
    'episode': {
      'count': 8,
    },
  },
];
