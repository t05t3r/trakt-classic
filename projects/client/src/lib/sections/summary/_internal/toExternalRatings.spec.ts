import imdbLogo from '$lib/assets/ratings/imdb.svg?no-inline';
import letterboxdLogo from '$lib/assets/ratings/letterboxd.svg?no-inline';
import metacriticHighLogo from '$lib/assets/ratings/metacritic-high.svg?no-inline';
import metacriticLowLogo from '$lib/assets/ratings/metacritic-low.svg?no-inline';
import metacriticMediumLogo from '$lib/assets/ratings/metacritic-medium.svg?no-inline';
import rtAudienceFreshLogo from '$lib/assets/ratings/rt-audience-fresh.svg?no-inline';
import rtAudienceRottenLogo from '$lib/assets/ratings/rt-audience-rotten.svg?no-inline';
import rtCriticFreshLogo from '$lib/assets/ratings/rt-critic-fresh.svg?no-inline';
import rtCriticRottenLogo from '$lib/assets/ratings/rt-critic-rotten.svg?no-inline';
import tmdbLogo from '$lib/assets/ratings/tmdb.svg?no-inline';
import type { MediaRating } from '$lib/requests/models/MediaRating.ts';
import { describe, expect, it } from 'vitest';
import { toExternalRatings } from './toExternalRatings.ts';

const IMDB_URL = 'https://www.imdb.com/title/tt1745960';
const TMDB_URL = 'https://www.themoviedb.org/movie/361743';
const RT_URL = 'https://www.rottentomatoes.com/m/top_gun_maverick';
const METACRITIC_URL = 'https://www.metacritic.com/movie/top-gun-maverick';
const LETTERBOXD_URL = 'https://letterboxd.com/film/top-gun-maverick/';
const MAL_URL = 'https://myanimelist.net/anime/5114';

const EVERY_SOURCE: MediaRating = {
  imdb: { rating: 8.2, votes: 827_301, url: IMDB_URL },
  tmdb: { rating: 8.06, votes: 11_104, url: TMDB_URL },
  rotten: { critic: 0.96, audience: 0.99, url: RT_URL },
  metascore: { rating: 78, url: METACRITIC_URL },
  letterboxd: { rating: 3.86, votes: 912_000, url: LETTERBOXD_URL },
  mal: { rating: 9.07, votes: 2_150_000, url: MAL_URL },
};

describe('toExternalRatings', () => {
  it('should format every source in the bar order, each linking to its page with its logo', () => {
    expect(toExternalRatings(EVERY_SOURCE)).toEqual([
      {
        key: 'imdb',
        label: 'IMDb',
        value: '8.2',
        caption: '827.3K',
        url: IMDB_URL,
        logo: imdbLogo,
      },
      {
        key: 'tmdb',
        label: 'TMDB',
        value: '81%',
        caption: '11.1K',
        url: TMDB_URL,
        logo: tmdbLogo,
      },
      {
        key: 'rt-critic',
        label: 'Rotten Tomatoes',
        value: '96%',
        caption: 'Critics',
        url: RT_URL,
        logo: rtCriticFreshLogo,
      },
      {
        key: 'rt-audience',
        label: 'Rotten Tomatoes',
        value: '99%',
        caption: 'Audience',
        url: RT_URL,
        logo: rtAudienceFreshLogo,
      },
      {
        key: 'metacritic',
        label: 'Metacritic',
        value: '78',
        band: 'high',
        url: METACRITIC_URL,
        logo: metacriticHighLogo,
      },
      {
        key: 'letterboxd',
        label: 'Letterboxd',
        value: '3.9/5',
        caption: '912K',
        url: LETTERBOXD_URL,
        logo: letterboxdLogo,
      },
      {
        key: 'mal',
        label: 'MAL',
        value: '9.1',
        caption: '2.2M',
        url: MAL_URL,
      },
    ]);
  });

  it('should leave out every source the ratings have no block for', () => {
    expect(toExternalRatings({})).toEqual([]);
  });

  it('should leave out the audience score when Rotten Tomatoes has none', () => {
    const ratings = toExternalRatings({
      rotten: { critic: 0.96, audience: null, url: RT_URL },
    });

    expect(ratings.map(({ key }) => key)).toEqual(['rt-critic']);
  });

  it('should caption a source without votes with nothing', () => {
    const [mal] = toExternalRatings({
      mal: { rating: 7.4, votes: null, url: null },
    });

    expect(mal).toEqual({
      key: 'mal',
      label: 'MAL',
      value: '7.4',
      url: null,
    });
  });

  it('should leave out a TMDB rating nobody has voted on', () => {
    const keysAt = (votes: number | Nil) =>
      toExternalRatings({ tmdb: { rating: 0, votes, url: TMDB_URL } })
        .map(({ key }) => key);

    expect(keysAt(0)).toEqual([]);
    expect(keysAt(null)).toEqual([]);
    expect(keysAt(undefined)).toEqual([]);
    expect(keysAt(1)).toEqual(['tmdb']);
  });

  it('should give both Rotten Tomatoes scores the fresh logo from 60% and the rotten one under it', () => {
    const logosAt = (score: number) =>
      toExternalRatings({ rotten: { critic: score, audience: score } })
        .map(({ logo }) => logo);

    expect(logosAt(0.6)).toEqual([rtCriticFreshLogo, rtAudienceFreshLogo]);
    expect(logosAt(0.59)).toEqual([rtCriticRottenLogo, rtAudienceRottenLogo]);
  });

  it('should band a metascore high from 75, medium from 40 and low under 40', () => {
    const bandAt = (rating: number) =>
      toExternalRatings({ metascore: { rating } }).at(0)?.band;

    expect(bandAt(75)).toBe('high');
    expect(bandAt(74)).toBe('medium');
    expect(bandAt(40)).toBe('medium');
    expect(bandAt(39)).toBe('low');
  });

  it("should give the metacritic logo its band's ring", () => {
    const logoAt = (rating: number) =>
      toExternalRatings({ metascore: { rating } }).at(0)?.logo;

    expect(logoAt(75)).toBe(metacriticHighLogo);
    expect(logoAt(40)).toBe(metacriticMediumLogo);
    expect(logoAt(39)).toBe(metacriticLowLogo);
  });
});
