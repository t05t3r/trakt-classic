import { MovieHereticResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticResponseMock.ts';
import { ActivityHistoryResponseMock } from '$mocks/data/users/response/ActivityHistoryResponseMock.ts';
import { HISTORY_URL } from '$mocks/data/users/HISTORY_URL.ts';
import { server } from '$mocks/server.ts';
import { renderSection } from '$test/beds/dashboard/renderSection.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import type { ActivityHistoryResponse } from '@trakt/api';
import { http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Last30DaysSection from './Last30DaysSection.svelte';

// The fixture's two plays fall on the window's second to last day.
const NOW = new Date('2025-02-01T12:00:00.000Z');

const [EPISODE_PLAY] = ActivityHistoryResponseMock;
if (!EPISODE_PLAY) throw new Error('ActivityHistoryResponseMock is empty');

function serve(answer: () => Response | Promise<Response>) {
  server.use(http.get(HISTORY_URL, answer));
}

function serveHistory(body: ReadonlyArray<ActivityHistoryResponse>) {
  serve(() => pagedResponse({ body: [...body] }));
}

const SECTION = { component: Last30DaysSection, name: 'Last 30 Days' };

// Classic spaces its dashes by margin, so the text holds no space around them.
function helpTextOf(region: HTMLElement) {
  return region.querySelector('.help-text')?.textContent?.replace(/\s+/g, ' ')
    .trim();
}

function boldOf(region: HTMLElement) {
  return [...region.querySelectorAll('.help-text b')]
    .map((figure) => figure.textContent?.replace(/\s+/g, ' ').trim());
}

async function emptyRegion() {
  const region = await renderSection(SECTION);
  await within(region).findByText('Nothing watched in the last 30 days.');

  return region;
}

describe('section: Last30DaysSection', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should hold the header with its spinner, no help line and no body while loading', async () => {
    serve(holdResponse(() => pagedResponse({ body: [] })).answer);

    const region = await renderSection(SECTION);

    const heading = within(region).getByRole('heading', { level: 2 });
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(heading).toHaveTextContent('Last 30 Days');
    expect(heading.querySelector('.section-title-spinner')).not.toBeNull();
    expect(region.querySelector('.help-text')).toBeNull();
    expect(region.querySelector('.trakt-empty-state')).toBeNull();
    expect(within(region).queryAllByRole('link')).toEqual([]);
  });

  it('should show the empty box and no help line when the window holds no play', async () => {
    serveHistory([]);

    const region = await emptyRegion();

    expect(region.querySelector('.help-text')).toBeNull();
    expect(within(region).queryAllByRole('link')).toEqual([]);
  });

  it("should show the empty box when the window's plays add up to no minutes", async () => {
    serveHistory([{
      id: 3,
      watched_at: '2025-01-31T20:00:00.000Z',
      action: 'watch',
      type: 'movie',
      movie: { ...MovieHereticResponseMock, runtime: null },
    }]);

    const region = await emptyRegion();

    expect(region.querySelector('.help-text')).toBeNull();
  });

  it('should show the error box and load the totals on Retry', async () => {
    serve(notFound);
    const region = await renderSection(SECTION);
    const retry = await within(region).findByRole('button', { name: 'Retry' });
    expect(region).toHaveTextContent("Couldn't load this section.");
    expect(region.querySelector('.help-text')).toBeNull();

    serveHistory(ActivityHistoryResponseMock);
    await userEvent.click(retry);

    await within(region).findByRole('link', { name: 'Drama: 1 episode' });
    expect(helpTextOf(region)).toBe('2h 51m watched—1 episode—1 movie');
  });

  describe('ready', () => {
    it("should total the window's minutes, episodes and movies in the help line", async () => {
      const region = await renderSection(SECTION);

      await within(region).findByRole('link', { name: 'Drama: 1 episode' });

      expect(helpTextOf(region)).toBe('2h 51m watched—1 episode—1 movie');
      expect(region.querySelector('.help-plays')).toBeNull();
    });

    it('should follow a total with its plays when they outnumber it', async () => {
      serveHistory([...ActivityHistoryResponseMock, {
        ...EPISODE_PLAY,
        id: 3,
        watched_at: '2025-01-30T20:00:00.000Z',
      }]);

      const region = await renderSection(SECTION);
      await within(region).findByRole('link', {
        name: 'Drama: 1 episode, 2 plays',
      });

      expect(helpTextOf(region))
        .toBe('3h 51m watched—1 episode (2 plays)—1 movie');
      expect(region.querySelector('.help-plays')).toHaveTextContent(
        '(2 plays)',
      );
    });

    it("should bold each total's figure, and not its words or plays", async () => {
      serveHistory([...ActivityHistoryResponseMock, {
        ...EPISODE_PLAY,
        id: 3,
        watched_at: '2025-01-30T20:00:00.000Z',
      }]);

      const region = await renderSection(SECTION);
      await within(region).findByRole('link', {
        name: 'Drama: 1 episode, 2 plays',
      });

      expect(boldOf(region)).toEqual(['3h 51m', '1', '1']);
    });

    it("should chart each of the window's days, linked to its history", async () => {
      const region = await renderSection(SECTION);

      const day = await within(region).findByRole('link', {
        name: '2h 51m, Friday — January 31, 1 episode, 1 movie',
      });

      expect(day).toHaveAttribute(
        'href',
        '/users/me/history?start_at=2025-01-31&days=1',
      );
      const plot = day.closest('div');
      if (!plot) throw new Error('no chart plot');
      expect(within(plot).getAllByRole('link')).toHaveLength(30);
    });

    it("should link each genre's counts into history from 30 days back", async () => {
      const region = await renderSection(SECTION);

      const drama = await within(region).findByRole('link', {
        name: 'Drama: 1 episode',
      });

      expect(drama).toHaveAttribute(
        'href',
        '/users/me/history/episodes?genres=drama&start_at=2025-01-02',
      );
      expect(
        within(region)
          .getAllByText(/^(Drama|Horror|Science Fiction|Thriller)$/)
          .map((name) => name.textContent),
      ).toEqual(['Drama', 'Horror', 'Science Fiction', 'Thriller']);
    });

    it('should put the chart before the genre bars', async () => {
      const region = await renderSection(SECTION);
      await within(region).findByRole('link', { name: 'Drama: 1 episode' });

      const chart = region.querySelector('.trakt-daily-minutes-chart');
      const genres = region.querySelector('.trakt-genre-bars');
      if (!chart || !genres) throw new Error('no chart or genre bars');

      expect(
        chart.compareDocumentPosition(genres) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
  });
});
