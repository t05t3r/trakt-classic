import type { ListItem } from '$lib/requests/models/ListItem.ts';
import { itemOfType } from '$test/beds/dashboard/itemOfType.ts';
import { describe, expect, it } from 'vitest';
import type { MediaCardInput } from './toMediaCard.ts';
import { toListItemCover } from './toListItemCover.ts';

const MOVIE = itemOfType('movie');
const SHOW = itemOfType('show');
const SEASON = itemOfType('season');
const EPISODE = itemOfType('episode');

const MOVIE_FANART = '/img/movies/000/259/852/fanarts/full/e09daea46f.jpg.webp';
const SHOW_FANART = '/img/shows/000/155/534/fanarts/full/d5270246b5.jpg.webp';
const SEASON_SHOW_FANART =
  '/img/shows/000/180/770/fanarts/full/b36cbd9e8a.jpg.webp';
const EPISODE_SHOW_FANART =
  '/img/shows/000/154/574/fanarts/full/13204ef9dd.jpg.webp';

const COVERS: ReadonlyArray<{
  name: string;
  item: ListItem | MediaCardInput;
  cover: string;
}> = [
  { name: 'a movie item', item: MOVIE, cover: MOVIE_FANART },
  {
    name: 'a movie input',
    item: { type: 'movie', movie: MOVIE.entry },
    cover: MOVIE_FANART,
  },
  { name: 'a show item', item: SHOW, cover: SHOW_FANART },
  {
    name: 'a show input',
    item: { type: 'show', show: SHOW.entry },
    cover: SHOW_FANART,
  },
  { name: 'a season item', item: SEASON, cover: SEASON_SHOW_FANART },
  {
    name: 'a season input',
    item: { type: 'season', ...SEASON.entry },
    cover: SEASON_SHOW_FANART,
  },
  { name: 'an episode item', item: EPISODE, cover: EPISODE_SHOW_FANART },
  {
    name: 'an episode input',
    item: { type: 'episode', ...EPISODE.entry },
    cover: EPISODE_SHOW_FANART,
  },
];

describe('util: toListItemCover', () => {
  it.each(COVERS)(
    "should give $name its movie's fanart, or else its show's",
    ({ item, cover }) => {
      expect(toListItemCover(item)).toBe(cover);
    },
  );
});
