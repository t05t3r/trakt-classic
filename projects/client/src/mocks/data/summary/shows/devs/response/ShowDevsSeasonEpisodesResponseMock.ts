import type { EpisodeResponse } from '@trakt/api';

type DevsEpisode = Pick<EpisodeResponse, 'number' | 'first_aired'> & {
  trakt: number;
  episode_type: EpisodeResponse['episode_type'];
};

const toResponse = (
  { number, first_aired, trakt, episode_type }: DevsEpisode,
): EpisodeResponse => ({
  season: 1,
  number,
  title: `Episode ${number}`,
  ids: { trakt },
  first_aired,
  released: first_aired,
  effective_release_date: first_aired,
  runtime: 52,
  episode_type,
});

const EPISODES: ReadonlyArray<DevsEpisode> = [
  {
    number: 1,
    first_aired: '2020-03-05T05:00:00.000Z',
    trakt: 3900001,
    episode_type: 'series_premiere',
  },
  {
    number: 2,
    first_aired: '2020-03-05T05:00:00.000Z',
    trakt: 3900002,
    episode_type: 'standard',
  },
  {
    number: 3,
    first_aired: '2020-03-12T04:00:00.000Z',
    trakt: 3900003,
    episode_type: 'standard',
  },
  {
    number: 4,
    first_aired: '2020-03-19T04:00:00.000Z',
    trakt: 3900004,
    episode_type: 'standard',
  },
  {
    number: 5,
    first_aired: '2020-03-26T04:00:00.000Z',
    trakt: 3900005,
    episode_type: 'standard',
  },
  {
    number: 6,
    first_aired: '2020-04-02T04:00:00.000Z',
    trakt: 3900006,
    episode_type: 'standard',
  },
  {
    number: 7,
    first_aired: '2020-04-09T04:00:00.000Z',
    trakt: 3900007,
    episode_type: 'standard',
  },
  {
    number: 8,
    first_aired: '2020-04-16T04:00:00.000Z',
    trakt: 3900008,
    episode_type: 'series_finale',
  },
];

export const ShowDevsSeasonEpisodesResponseMock: EpisodeResponse[] = EPISODES
  .map(toResponse);
