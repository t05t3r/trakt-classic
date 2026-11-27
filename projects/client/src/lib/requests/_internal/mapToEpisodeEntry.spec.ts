import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { describe, expect, it } from 'vitest';
import { mapToEpisodeEntry } from './mapToEpisodeEntry.ts';

describe('mapToEpisodeEntry', () => {
  it('should map a screenshot at the media host into every display size', () => {
    const episode = mapToEpisodeEntry({
      ...EpisodeSiloResponseMock,
      images: {
        ...EpisodeSiloResponseMock.images,
        screenshot: ['media.trakt.tv/episodes/5165667/medium/screenshot.webp'],
      },
    });

    expect(episode.cover.url).toEqual({
      medium: '/img/episodes/5165667/medium/screenshot.webp',
      thumb: '/img/episodes/5165667/thumb/screenshot.webp',
      full: '/img/episodes/5165667/full/screenshot.webp',
    });
  });

  it.each([0, 12])(
    'should map an absolute number of %s',
    (numberAbs) => {
      const episode = mapToEpisodeEntry({
        ...EpisodeSiloResponseMock,
        number_abs: numberAbs,
      });

      expect(episode.numberAbs).toBe(numberAbs);
    },
  );

  it('should leave out an absolute number the response has none of', () => {
    expect(mapToEpisodeEntry(EpisodeSiloResponseMock)).not.toHaveProperty(
      'numberAbs',
    );
  });
});
