import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { toMediaFanart } from './toMediaFanart.ts';

describe('toMediaFanart', () => {
  it.each([
    {
      kind: 'a movie',
      media: MovieHereticMappedMock,
      fanart: {
        src: '/img/movies/000/916/302/fanarts/thumb/626327d7b4.jpg.webp',
        alt: '"Heretic" fanart',
      },
    },
    {
      kind: 'a show',
      media: ShowSiloMappedMock,
      fanart: {
        src: '/img/shows/000/180/770/fanarts/thumb/80d39f8578.jpg.webp',
        alt: '"Silo" fanart',
      },
    },
  ])(
    "should give $kind's fanart thumb, named after its title",
    ({ media, fanart }) => {
      expect(toMediaFanart(media)).toEqual(fanart);
    },
  );
});
