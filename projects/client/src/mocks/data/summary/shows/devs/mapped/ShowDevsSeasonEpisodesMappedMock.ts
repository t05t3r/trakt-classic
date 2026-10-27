import { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';
import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';

type DevsEpisode = Pick<EpisodeEntry, 'id' | 'number' | 'type'> & {
  aired: string;
};

const toEntry = ({ id, number, type, aired }: DevsEpisode): EpisodeEntry => ({
  id,
  key: `episode-${id}`,
  type,
  title: `Episode ${number}`,
  overview: '',
  season: 1,
  number,
  genres: [],
  runtime: 52,
  cover: {
    url: {
      medium: PLACEHOLDERS.fanart,
      thumb: PLACEHOLDERS.fanart,
      full: PLACEHOLDERS.fanart,
    },
  },
  airDate: new Date(aired),
  releaseDate: new Date(aired),
  effectiveReleaseDate: new Date(aired),
  year: 2020,
  postCredits: [],
});

const EPISODES: ReadonlyArray<DevsEpisode> = [
  {
    id: 3900001,
    number: 1,
    type: 'series_premiere',
    aired: '2020-03-05T05:00:00.000Z',
  },
  {
    id: 3900002,
    number: 2,
    type: 'standard',
    aired: '2020-03-05T05:00:00.000Z',
  },
  {
    id: 3900003,
    number: 3,
    type: 'standard',
    aired: '2020-03-12T04:00:00.000Z',
  },
  {
    id: 3900004,
    number: 4,
    type: 'standard',
    aired: '2020-03-19T04:00:00.000Z',
  },
  {
    id: 3900005,
    number: 5,
    type: 'standard',
    aired: '2020-03-26T04:00:00.000Z',
  },
  {
    id: 3900006,
    number: 6,
    type: 'standard',
    aired: '2020-04-02T04:00:00.000Z',
  },
  {
    id: 3900007,
    number: 7,
    type: 'standard',
    aired: '2020-04-09T04:00:00.000Z',
  },
  {
    id: 3900008,
    number: 8,
    type: 'series_finale',
    aired: '2020-04-16T04:00:00.000Z',
  },
];

export const ShowDevsSeasonEpisodesMappedMock: EpisodeEntry[] = EPISODES.map(
  toEntry,
);
