import type { HistoryEntry } from '$lib/features/history/stores/useHistoryItems.ts';
import QuickActions from '$lib/features/media-actions/components/QuickActions.svelte';
import { EPISODE_PLAY } from '$mocks/data/users/EPISODE_PLAY.ts';
import { MOVIE_PLAY } from '$mocks/data/users/MOVIE_PLAY.ts';
import { NO_DATE } from '$mocks/data/users/NO_DATE.ts';
import { SHOW_PLAYS } from '$mocks/data/users/SHOW_PLAYS.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { toHistoryCard } from './toHistoryCard.ts';

const UNDATED: ReadonlyArray<{
  type: string;
  play: HistoryEntry;
  watch: string;
}> = [
  {
    type: 'movie',
    play: { ...MOVIE_PLAY, movie: { ...MOVIE_PLAY.movie, ...NO_DATE } },
    watch: 'Remove "Heretic" from your History',
  },
  {
    type: 'episode',
    play: { ...EPISODE_PLAY, episode: { ...EPISODE_PLAY.episode, ...NO_DATE } },
    watch: 'Mark "Freedom Day" as watched',
  },
];

describe('util: toHistoryCard', () => {
  describe.each(UNDATED)(
    'a watched $type with no air date',
    ({ play, watch }) => {
      it('should read the play as its air date', () => {
        expect(toHistoryCard(play).target.airDate).toEqual(play.watchedAt);
      });

      it('should keep its watch icon', async () => {
        renderComponent(QuickActions, {
          props: { target: toHistoryCard(play).target },
        });

        expect(await screen.findByRole('button', { name: watch }))
          .toBeVisible();
      });
    },
  );

  it('should read the play as the air date of a show with no air date', () => {
    const play = { ...SHOW_PLAYS, show: { ...SHOW_PLAYS.show, ...NO_DATE } };

    expect(toHistoryCard(play).target.airDate).toEqual(play.watchedAt);
  });

  it('should keep the air date of an item that aired before its play', () => {
    expect(toHistoryCard(MOVIE_PLAY).target.airDate).toEqual(
      MOVIE_PLAY.movie.airDate,
    );
    expect(toHistoryCard(EPISODE_PLAY).target.airDate).toEqual(
      EPISODE_PLAY.episode.airDate,
    );
    expect(toHistoryCard(SHOW_PLAYS).target.airDate).toEqual(
      SHOW_PLAYS.show.airDate,
    );
  });

  it("should map a movie play to the movie's card and poster", () => {
    const card = toHistoryCard(MOVIE_PLAY);

    expect(card.href).toBe('/movies/heretic-2024');
    expect(card.posterTitle).toBe('Heretic');
    expect(card.poster).toEqual(MOVIE_PLAY.movie.poster);
    expect(card).not.toHaveProperty('episodeType');
  });

  it("should map an episode play to the episode's card and its show's poster", () => {
    const card = toHistoryCard(EPISODE_PLAY);

    expect(card.href).toBe('/shows/silo/seasons/1/episodes/1');
    expect(card.posterTitle).toBe('Silo');
    expect(card.poster).toEqual(EPISODE_PLAY.show.poster);
    expect(card.episodeType).toBe(EPISODE_PLAY.episode.type);
  });

  it("should map a show's plays to the show's card, Target and poster", () => {
    const card = toHistoryCard(SHOW_PLAYS);

    expect(card.href).toBe('/shows/silo');
    expect(card.posterTitle).toBe('Silo');
    expect(card.poster).toEqual(SHOW_PLAYS.show.poster);
    expect(card.target.type).toBe('show');
    expect(card.target.id).toBe(SHOW_PLAYS.show.id);
    expect(card).not.toHaveProperty('episodeType');
  });
});
