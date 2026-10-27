import type { CalendarEntry } from '$lib/requests/models/CalendarEntry.ts';
import type { EpisodeType } from '$lib/requests/models/EpisodeType.ts';
import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { EpisodeSiloMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloMappedMock.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { movieOn } from '$test/beds/calendar/movieOn.ts';
import { describe, expect, it } from 'vitest';
import { toScheduleEpisodes } from './toScheduleEpisodes.ts';

const AIRS_AT = new Date('2023-05-05T01:00:00.000Z');

function episodeLine(
  { showId = ShowSiloMappedMock.id, id = EpisodeSiloMappedMock.id, ...episode }:
    & { showId?: number; id?: number }
    & Partial<
      { season: number; number: number; type: EpisodeType; airDate: Date }
    >,
): CalendarEntry {
  return {
    kind: 'episode',
    show: { ...ShowSiloMappedMock, id: showId, key: `show-${showId}` },
    episode: { ...EpisodeSiloMappedMock, ...episode, id, key: `episode-${id}` },
    airsAt: AIRS_AT,
  };
}

describe('toScheduleEpisodes', () => {
  it('should map an episode to its show, episode line, air time and network', () => {
    expect(toScheduleEpisodes({ lines: [episodeLine({})] })).toEqual([
      {
        key: 'episode-5165667',
        props: {
          kind: 'episode',
          title: 'Silo',
          href: '/shows/silo',
          sameShow: false,
          episode: {
            sxe: '1x01',
            text: 'Freedom Day',
            href: '/shows/silo/seasons/1/episodes/1',
          },
          airsAt: AIRS_AT,
          network: 'Apple TV+',
        },
        tagType: 'series_premiere',
        media: {
          key: 'show-180770',
          poster: ShowSiloMappedMock.poster.url.thumb,
        },
      },
    ]);
  });

  it('should map a movie to its page and tagline, with no tag', () => {
    expect(
      toScheduleEpisodes({
        lines: [movieOn(MovieHereticMappedMock.id, '2023-05-05')],
      }),
    ).toEqual([
      {
        key: 'movie-916302',
        props: {
          kind: 'movie',
          title: 'Heretic',
          href: '/movies/heretic-2024',
          tagline: 'Question everything.',
        },
        media: {
          key: 'movie-916302',
          poster: MovieHereticMappedMock.poster.url.thumb,
        },
      },
    ]);
  });

  it("should key each line by its show's or movie's key", () => {
    const entries = toScheduleEpisodes({
      lines: [
        episodeLine({ id: 1 }),
        episodeLine({ id: 2, showId: 7 }),
        movieOn(MovieHereticMappedMock.id, '2023-05-05'),
        episodeLine({ id: 3 }),
      ],
    });

    expect(entries.map(({ media }) => media.key)).toEqual([
      'show-180770',
      'show-7',
      'movie-916302',
      'show-180770',
    ]);
  });

  it('should mark an episode that follows an episode of the same show', () => {
    const entries = toScheduleEpisodes({
      lines: [
        episodeLine({ id: 1, number: 1 }),
        episodeLine({ id: 2, number: 2 }),
        episodeLine({ id: 3, showId: 7, number: 1 }),
        episodeLine({ id: 4, number: 3 }),
      ],
    });

    expect(
      entries.map(({ props }) => props.kind === 'episode' && props.sameShow),
    )
      .toEqual([false, true, false, false]);
  });

  it('should let a movie between two episodes of a show break the run', () => {
    const entries = toScheduleEpisodes({
      lines: [
        episodeLine({ id: 1 }),
        movieOn(MovieHereticMappedMock.id, '2023-05-05'),
        episodeLine({ id: 2 }),
      ],
    });

    expect(entries.at(2)?.props).toMatchObject({ sameShow: false });
  });

  it("should not count a movie whose id is the show's", () => {
    const entries = toScheduleEpisodes({
      lines: [movieOn(ShowSiloMappedMock.id, '2023-05-05'), episodeLine({})],
    });

    expect(entries.at(1)?.props).toMatchObject({ sameShow: false });
  });

  it('should never mark the first line, even when the last is the same show', () => {
    const entries = toScheduleEpisodes({
      lines: [
        episodeLine({ id: 1 }),
        movieOn(MovieHereticMappedMock.id, '2023-05-05'),
        episodeLine({ id: 2 }),
      ],
    });

    expect(entries.at(0)?.props).toMatchObject({ sameShow: false });
  });

  it('should name a full season by its number and link its season page', () => {
    const [entry] = toScheduleEpisodes({
      lines: [episodeLine({ season: 4, type: 'full_season' })],
    });

    expect(entry?.props).toMatchObject({
      episode: {
        text: 'Season 4',
        href: '/shows/silo/seasons/4',
      },
    });
    expect(entry?.props).not.toHaveProperty('episode.sxe');
  });

  it('should name season 0 Specials', () => {
    const [entry] = toScheduleEpisodes({
      lines: [episodeLine({ season: 0, type: 'full_season' })],
    });

    expect(entry?.props).toMatchObject({ episode: { text: 'Specials' } });
  });

  it('should set the tag type of a tagged episode', () => {
    const [entry] = toScheduleEpisodes({
      lines: [episodeLine({ type: 'season_finale' })],
    });

    expect(entry?.tagType).toBe('season_finale');
  });

  it.each<EpisodeType>(['standard', 'full_season', 'multiple_episodes'])(
    'should set no tag type for a %s line',
    (type) => {
      const [entry] = toScheduleEpisodes({ lines: [episodeLine({ type })] });

      expect(entry?.tagType).toBeUndefined();
    },
  );

  it('should set no tag type for a movie', () => {
    const [entry] = toScheduleEpisodes({
      lines: [movieOn(MovieHereticMappedMock.id, '2023-05-05')],
    });

    expect(entry?.tagType).toBeUndefined();
  });

  it("should air a run's episode with no air date of its own at the row's time", () => {
    const [entry] = toScheduleEpisodes({
      lines: [episodeLine({ airDate: MAX_DATE })],
    });

    expect(entry?.props).toMatchObject({ airsAt: AIRS_AT });
  });
});
