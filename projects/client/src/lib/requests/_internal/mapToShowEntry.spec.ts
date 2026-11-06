import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { describe, expect, it } from 'vitest';
import { mapToShowEntry } from './mapToShowEntry.ts';

describe('mapToShowEntry', () => {
  it('should proxy a thumb at the media host at the size it arrives in', () => {
    const show = mapToShowEntry({
      ...ShowSiloResponseMock,
      images: {
        ...assertDefined(ShowSiloResponseMock.images),
        thumb: ['media.trakt.tv/shows/180770/medium/thumb.webp'],
      },
    });

    expect(show.thumb.url).toBe('/img/shows/180770/medium/thumb.webp');
  });
});
