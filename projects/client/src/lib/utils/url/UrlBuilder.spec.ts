import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { UrlBuilder } from './UrlBuilder.ts';

describe('util: UrlBuilder', () => {
  describe('dashboard', () => {
    it('should point at the dashboard', () => {
      expect(UrlBuilder.dashboard()).to.equal('/dashboard');
    });
  });

  describe('search', () => {
    it('should point at the search page', () => {
      expect(UrlBuilder.search()).to.equal('/search');
    });

    it('should keep the path literal in its type', () => {
      expectTypeOf(UrlBuilder.search).returns.toEqualTypeOf<'/search'>();
    });
  });

  it('should not build the home route', () => {
    expect(UrlBuilder).not.toHaveProperty('home');
  });

  describe('calendar', () => {
    it('should point at the calendars', () => {
      expect(UrlBuilder.calendar()).to.equal('/calendars');
    });
  });

  describe('showsTrending', () => {
    it('should point at the trending shows', () => {
      expect(UrlBuilder.showsTrending()).to.equal('/shows/trending');
    });
  });

  describe('moviesTrending', () => {
    it('should point at the trending movies', () => {
      expect(UrlBuilder.moviesTrending()).to.equal('/movies/trending');
    });
  });

  describe('shows', () => {
    it('should point at the shows', () => {
      expect(UrlBuilder.shows()).to.equal('/shows');
    });

    it('should keep the path literal in its type', () => {
      expectTypeOf(UrlBuilder.shows).returns.toEqualTypeOf<'/shows'>();
    });
  });

  describe('movie', () => {
    it("should point at the movie's page", () => {
      expect(UrlBuilder.movie('heretic-2024')).to.equal('/movies/heretic-2024');
    });

    it('should type the path as a movie path', () => {
      expectTypeOf(UrlBuilder.movie).returns
        .toEqualTypeOf<`/movies/${string}`>();
    });
  });

  describe('people', () => {
    it("should point at the person's page by slug", () => {
      expect(UrlBuilder.people('joseph-kosinski')).to.equal(
        '/people/joseph-kosinski',
      );
    });

    it('should type the path as a person path', () => {
      expectTypeOf(UrlBuilder.people).returns
        .toEqualTypeOf<`/people/${string}`>();
    });
  });

  describe('discover', () => {
    it('should point at the discover hub', () => {
      expect(UrlBuilder.discover()).to.equal('/discover');
    });

    it('should take no params', () => {
      expectTypeOf(UrlBuilder.discover).parameters.toEqualTypeOf<[]>();
    });
  });

  describe('recommended', () => {
    it('should point at the show and movie recommendations', () => {
      expect([UrlBuilder.recommended('show'), UrlBuilder.recommended('movie')])
        .toEqual(['/shows/recommendations', '/movies/recommendations']);
    });

    it('should keep the paths literal in its type', () => {
      expectTypeOf(UrlBuilder.recommended).returns.toEqualTypeOf<
        '/shows/recommendations' | '/movies/recommendations'
      >();
    });
  });

  describe('top links', () => {
    it('should keep every top-link path literal in its type', () => {
      expectTypeOf(UrlBuilder.dashboard).returns.toEqualTypeOf<'/dashboard'>();
      expectTypeOf(UrlBuilder.showsTrending).returns
        .toEqualTypeOf<'/shows/trending'>();
      expectTypeOf(UrlBuilder.moviesTrending).returns
        .toEqualTypeOf<'/movies/trending'>();
      expectTypeOf(UrlBuilder.calendar).returns.toEqualTypeOf<'/calendars'>();
      expectTypeOf(UrlBuilder.discover).returns.toEqualTypeOf<'/discover'>();
    });
  });

  describe('profile rows', () => {
    it('should point at the signed-in user pages', () => {
      expect([
        UrlBuilder.history.home(),
        UrlBuilder.progress(),
        UrlBuilder.ratings(),
        UrlBuilder.lists.home(),
      ]).toEqual([
        '/users/me/history',
        '/users/me/progress',
        '/users/me/ratings',
        '/users/me/lists',
      ]);
    });

    it('should keep every profile-row path literal in its type', () => {
      expectTypeOf(UrlBuilder.history.home).returns
        .toEqualTypeOf<
          | '/users/me/history'
          | '/users/me/history/episodes'
          | '/users/me/history/shows'
          | '/users/me/history/movies'
        >();
      expectTypeOf(UrlBuilder.progress).returns
        .toEqualTypeOf<'/users/me/progress'>();
      expectTypeOf(UrlBuilder.ratings).returns
        .toEqualTypeOf<'/users/me/ratings'>();
      expectTypeOf(UrlBuilder.lists.home).returns
        .toEqualTypeOf<'/users/me/lists'>();
    });
  });

  describe('history', () => {
    it('should narrow the history to episodes', () => {
      expect(UrlBuilder.history.home('episodes'))
        .to.equal('/users/me/history/episodes');
    });

    it('should narrow the history to shows', () => {
      expect(UrlBuilder.history.home('shows'))
        .to.equal('/users/me/history/shows');
    });

    it('should narrow the history to movies', () => {
      expect(UrlBuilder.history.home('movies'))
        .to.equal('/users/me/history/movies');
    });

    it("should narrow a type's history to a genre from a start date", () => {
      expect(
        UrlBuilder.history.genre({
          type: 'episodes',
          genre: 'science-fiction',
          startAt: '2026-06-07',
        }),
      ).to.equal(
        '/users/me/history/episodes?genres=science-fiction&start_at=2026-06-07',
      );
    });

    it("should keep a genre link's path literal in its type", () => {
      expectTypeOf(UrlBuilder.history.genre).returns.toEqualTypeOf<
        | '/users/me/history/episodes'
        | '/users/me/history/shows'
        | '/users/me/history/movies'
        | `/users/me/history/episodes?${string}`
        | `/users/me/history/shows?${string}`
        | `/users/me/history/movies?${string}`
      >();
    });

    describe('day', () => {
      it('should narrow the history to one day from its start', () => {
        expect(UrlBuilder.history.day(new Date('2026-10-05T12:00:00.000Z')))
          .to.equal('/users/me/history?start_at=2026-10-05&days=1');
      });

      it('should start at the local day east of UTC, not the UTC day', () => {
        setTimeZone('Asia/Tokyo');

        expect(UrlBuilder.history.day(new Date('2026-10-04T15:30:00.000Z')))
          .to.equal('/users/me/history?start_at=2026-10-05&days=1');
      });

      it("should keep a day link's path literal in its type", () => {
        expectTypeOf(UrlBuilder.history.day).returns.toEqualTypeOf<
          '/users/me/history' | `/users/me/history?${string}`
        >();
      });
    });
  });

  describe('landing', () => {
    it('should point at the landing page without params', () => {
      expect(UrlBuilder.landing()).to.equal('/');
    });

    it('should carry only the return path', () => {
      expect(UrlBuilder.landing({ returnTo: '/dashboard' }))
        .to.equal('/?returnTo=%2Fdashboard');
    });

    it('should carry only the error', () => {
      expect(UrlBuilder.landing({ error: 'expired' }))
        .to.equal('/?error=expired');
    });

    it('should encode a return path with its own query', () => {
      expect(UrlBuilder.landing({ returnTo: '/calendar?week=1' }))
        .to.equal('/?returnTo=%2Fcalendar%3Fweek%3D1');
    });

    it('should encode a space in the return path as a plus', () => {
      expect(UrlBuilder.landing({ returnTo: '/search?query=a b' }))
        .to.equal('/?returnTo=%2Fsearch%3Fquery%3Da+b');
    });

    it('should carry the return path and the error together', () => {
      expect(UrlBuilder.landing({ returnTo: '/dashboard', error: 'expired' }))
        .to.equal('/?returnTo=%2Fdashboard&error=expired');
    });
  });

  describe('auth', () => {
    it('should point the login at the return path', () => {
      expect(UrlBuilder.auth.login({ returnTo: '/dashboard' }))
        .to.equal('/auth/login?returnTo=%2Fdashboard');
    });

    it('should encode a login return path with its own query', () => {
      expect(UrlBuilder.auth.login({ returnTo: '/calendar?week=1' }))
        .to.equal('/auth/login?returnTo=%2Fcalendar%3Fweek%3D1');
    });

    it('should encode a space in the login return path as a plus', () => {
      expect(UrlBuilder.auth.login({ returnTo: '/search?query=a b' }))
        .to.equal('/auth/login?returnTo=%2Fsearch%3Fquery%3Da+b');
    });

    it('should point at the OAuth callback', () => {
      expect(UrlBuilder.auth.callback()).to.equal('/auth/callback');
    });

    it('should point at the logout endpoint', () => {
      expect(UrlBuilder.auth.logout()).to.equal('/auth/logout');
    });

    it('should point at the token refresh endpoint', () => {
      expect(UrlBuilder.auth.refresh()).to.equal('/auth/refresh');
    });
  });

  describe('show', () => {
    it('should point at the show page', () => {
      expect(UrlBuilder.show('silo')).to.equal('/shows/silo');
    });

    it('should keep the path literal in its type', () => {
      expectTypeOf(UrlBuilder.show).returns
        .toEqualTypeOf<`/shows/${string}`>();
    });
  });

  describe('episode', () => {
    it('should point at the episode page', () => {
      expect(UrlBuilder.episode('silo', 1, 1)).to.equal(
        '/shows/silo/seasons/1/episodes/1',
      );
    });

    it('should keep the path literal in its type', () => {
      expectTypeOf(UrlBuilder.episode).returns
        .toEqualTypeOf<
          `/shows/${string}/seasons/${number}/episodes/${number}`
        >();
    });
  });

  describe('season', () => {
    it('should point at the season page', () => {
      expect(UrlBuilder.season('silo', 3)).to.equal('/shows/silo/seasons/3');
    });

    it('should support specials (season 0)', () => {
      expect(UrlBuilder.season('silo', 0)).to.equal('/shows/silo/seasons/0');
    });

    it('should keep the path literal in its type', () => {
      expectTypeOf(UrlBuilder.season).returns
        .toEqualTypeOf<`/shows/${string}/seasons/${number}`>();
    });
  });

  describe('lists.watchlist', () => {
    it("should point at the user's watchlist page", () => {
      expect(UrlBuilder.lists.watchlist('me')).to.equal('/users/me/watchlist');
    });

    it('should keep the path literal in its type', () => {
      expectTypeOf(UrlBuilder.lists.watchlist).returns
        .toEqualTypeOf<`/users/${string}/watchlist`>();
    });

    it('should take the user only', () => {
      expectTypeOf(UrlBuilder.lists.watchlist).parameters
        .toEqualTypeOf<[string]>();
    });
  });

  describe('lists.official', () => {
    it('should point at the official list page', () => {
      expect(UrlBuilder.lists.official('top-gun-collection')).to.equal(
        '/lists/official/top-gun-collection',
      );
    });

    it('should keep the path literal in its type', () => {
      expectTypeOf(UrlBuilder.lists.official).returns
        .toEqualTypeOf<`/lists/official/${string}`>();
    });

    it('should take the slug only', () => {
      expectTypeOf(UrlBuilder.lists.official).parameters
        .toEqualTypeOf<[string]>();
    });
  });

  describe('users.lists', () => {
    it("should point at the user's list page", () => {
      expect(UrlBuilder.users('harry').lists('silos')).to.equal(
        '/users/harry/lists/silos',
      );
    });

    it('should keep the path literal in its type', () => {
      expectTypeOf(UrlBuilder.users('harry').lists).returns
        .toEqualTypeOf<`/users/${string}/lists/${string}`>();
    });
  });

  describe('external.imdb.season', () => {
    it("should point at the season's episode list on the show's IMDb page", () => {
      expect(UrlBuilder.external.imdb.season('tt14688458', 2)).to.equal(
        'https://www.imdb.com/title/tt14688458/episodes?season=2',
      );
    });

    it("should point the specials at the show's plain episode list", () => {
      expect(UrlBuilder.external.imdb.season('tt14688458', SPECIALS)).to.equal(
        'https://www.imdb.com/title/tt14688458/episodes',
      );
    });
  });

  describe('external.tmdb.season', () => {
    it("should point at the season's TMDB page by the show's id", () => {
      expect(UrlBuilder.external.tmdb.season({ id: '124364', season: 2 }))
        .to.equal('https://www.themoviedb.org/tv/124364/season/2');
    });
  });

  describe('external.tmdb.episode', () => {
    it("should point at the episode's TMDB page by the show's id", () => {
      expect(
        UrlBuilder.external.tmdb.episode({
          id: '124364',
          season: 1,
          episode: 1,
        }),
      ).to.equal('https://www.themoviedb.org/tv/124364/season/1/episode/1');
    });
  });
});
