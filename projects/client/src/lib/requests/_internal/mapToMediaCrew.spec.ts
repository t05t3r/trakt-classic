import type { PeopleGuestStarsResponse } from '$lib/requests/models/PeopleGuestStarsResponse.ts';
import type { PeopleResponse } from '@trakt/api';
import { describe, expect, it } from 'vitest';
import { mapToMediaCrew } from './mapToMediaCrew.ts';

describe('mapToMediaCrew', () => {
  it('should guard nullable cast character fields from the API', () => {
    const response = {
      cast: [
        {
          character: null,
          characters: ['Primary Role', 'Secondary Role'],
          person: {
            name: 'Actor One',
            ids: { slug: 'actor-one' },
            images: {},
          },
        },
        {
          character: null,
          characters: null,
          person: {
            name: 'Actor Two',
            ids: { slug: 'actor-two' },
            images: {},
          },
        },
      ],
    } as unknown as PeopleResponse;

    expect(mapToMediaCrew(response).cast).toMatchObject([
      {
        characterName: 'Primary Role',
        characters: ['Primary Role', 'Secondary Role'],
      },
      {
        characterName: '',
      },
    ]);
  });

  it('should map the guest stars as cast members', () => {
    const response: PeopleGuestStarsResponse = {
      guest_stars: [
        {
          character: 'Guest Role',
          characters: ['Guest Role'],
          episode_count: 2,
          person: {
            name: 'Guest One',
            ids: { trakt: 1, slug: 'guest-one', imdb: null, tmdb: null },
            images: {
              headshot: [
                'media.trakt.tv/images/people/000/000/001/headshots/thumb/a1.jpg.webp',
              ],
              fanart: [],
            },
          },
        },
      ],
    };

    expect(mapToMediaCrew(response).guestStars).toEqual([
      {
        name: 'Guest One',
        key: 'guest-one',
        episodeCount: 2,
        characterName: 'Guest Role',
        headshot: {
          url: {
            thumb: '/img/people/000/000/001/headshots/thumb/a1.jpg.webp',
            medium: '/img/people/000/000/001/headshots/medium/a1.jpg.webp',
            full: '/img/people/000/000/001/headshots/full/a1.jpg.webp',
          },
        },
      },
    ]);
  });

  it('should throw on a missing response body', () => {
    expect(() => mapToMediaCrew(undefined)).toThrow(
      'People response body is missing',
    );
  });

  it('should read a response without guest stars as none', () => {
    const response: PeopleResponse = { cast: [], crew: {} };

    expect(mapToMediaCrew(response).guestStars).toEqual([]);
  });
});
