import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { MovieHereticResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticResponseMock.ts';
import { ShowDevsMappedMock } from '$mocks/data/summary/shows/devs/ShowDevsMappedMock.ts';
import { ShowDevsResponseMock } from '$mocks/data/summary/shows/devs/ShowDevsResponseMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { serveCalendarRows } from '$test/beds/calendar/serveCalendarRows.ts';
import { renderSection } from '$test/beds/dashboard/renderSection.ts';
import { within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import type { HotReleaseResponse } from '@trakt/api';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import UpcomingScheduleSection from './UpcomingScheduleSection.svelte';

function episodeRow(day: number): HotReleaseResponse {
  return {
    first_aired: `2023-05-${String(day).padStart(2, '0')}T01:00:00.000Z`,
    episode: {
      ...EpisodeSiloResponseMock,
      ids: { ...EpisodeSiloResponseMock.ids, trakt: day },
    },
    show: ShowSiloResponseMock,
  };
}

// An entry's headings, under the date's own `h3`.
function entryHeadingsOf(group: HTMLElement) {
  return within(group).getAllByRole('heading').slice(1).map((heading) =>
    heading.textContent?.replace(/\s+/g, ' ').trim()
  );
}

const SILO_POSTER = ShowSiloMappedMock.poster.url.thumb;
const DEVS_POSTER = ShowDevsMappedMock.poster.url.thumb;
const HERETIC_POSTER = MovieHereticMappedMock.poster.url.thumb;

const MIXED_DAY: HotReleaseResponse[] = [
  episodeRow(5),
  {
    first_aired: '2023-05-05T02:00:00.000Z',
    episode: {
      ...EpisodeSiloResponseMock,
      ids: { ...EpisodeSiloResponseMock.ids, trakt: 41 },
    },
    show: ShowDevsResponseMock,
  },
  {
    first_aired: '2023-05-05T03:00:00.000Z',
    episode: {
      ...EpisodeSiloResponseMock,
      ids: { ...EpisodeSiloResponseMock.ids, trakt: 42 },
      number: 2,
      title: "Holston's Pick",
      episode_type: 'standard',
    },
    show: ShowSiloResponseMock,
  },
  { released: '2023-05-05', movie: MovieHereticResponseMock },
];

// A same-show entry's empty meta line is presentational too, so only images count.
function postersOf(group: HTMLElement) {
  return within(group).queryAllByRole('presentation')
    .filter((poster) => poster instanceof HTMLImageElement)
    .map((poster) => ({
      src: poster.getAttribute('src'),
      isShown: poster.closest('.is-shown') !== null,
    }));
}

function shownPosterOf(group: HTMLElement) {
  return postersOf(group).filter(({ isShown }) => isShown).map(({ src }) =>
    src
  );
}

function columnsOf(region: HTMLElement) {
  return within(region).getAllByRole('group').map((group) => [
    within(group).getByRole('heading', { level: 3 }).textContent?.trim(),
    group.dataset.column,
  ]);
}

const SECTION = {
  component: UpcomingScheduleSection,
  name: 'Upcoming Schedule',
};

describe('section: UpcomingScheduleSection', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2023-05-04T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should head each date with its weekday, then the date', async () => {
    serveCalendarRows([
      {
        first_aired: '2023-05-05T01:00:00.000Z',
        episode: EpisodeSiloResponseMock,
        show: ShowSiloResponseMock,
      },
      { released: '2023-05-06', movie: MovieHereticResponseMock },
    ]);

    const region = await renderSection(SECTION);

    const headings = await within(region).findAllByRole('heading', {
      level: 3,
    });
    expect(headings.map((heading) => heading.textContent?.trim()))
      .toEqual(['Friday 5 May', 'Saturday 6 May']);
    expect(
      headings.map((heading) => heading.querySelector('strong')?.textContent),
    )
      .toEqual(['Friday', 'Saturday']);
  });

  it("should list a show's episode and a movie under their dates", async () => {
    serveCalendarRows([
      {
        first_aired: '2023-05-05T01:00:00.000Z',
        episode: EpisodeSiloResponseMock,
        show: ShowSiloResponseMock,
      },
      { released: '2023-05-06', movie: MovieHereticResponseMock },
    ]);

    const region = await renderSection(SECTION);

    expect(
      entryHeadingsOf(
        await within(region).findByRole('group', { name: 'Friday 5 May' }),
      ),
    ).toEqual([
      'Silo',
      '1x01 Freedom Day',
      'Series Premiere01:00 on Apple TV+',
    ]);
    expect(
      entryHeadingsOf(
        within(region).getByRole('group', { name: 'Saturday 6 May' }),
      ),
    ).toEqual(['Heretic', 'Question everything.']);
    expect(within(region).getByText('Series Premiere'))
      .toHaveAttribute('data-type', 'series_premiere');
  });

  it("should list a show's run with its title and air line once", async () => {
    serveCalendarRows([
      {
        first_aired: '2023-05-05T01:00:00.000Z',
        episode: {
          ...EpisodeSiloResponseMock,
          episode_type: 'multiple_episodes',
          episodes: [
            EpisodeSiloResponseMock,
            {
              ...EpisodeSiloResponseMock,
              ids: { ...EpisodeSiloResponseMock.ids, trakt: 5165668 },
              number: 2,
              title: "Holston's Pick",
              episode_type: 'standard',
            },
          ],
        },
        show: ShowSiloResponseMock,
      },
    ]);

    const region = await renderSection(SECTION);

    const group = await within(region).findByRole('group', {
      name: 'Friday 5 May',
    });
    expect(entryHeadingsOf(group)).toEqual([
      'Silo',
      '1x01 Freedom Day',
      'Series Premiere01:00 on Apple TV+',
      "1x02 Holston's Pick",
    ]);
    // An entry's episode line sits directly in the entry.
    expect(
      within(group).getAllByRole('heading', { level: 5 }).map((line) =>
        line.parentElement?.classList.contains('is-same-show')
      ),
    ).toEqual([false, true]);
  });

  it('should tag neither a full season nor a standard episode', async () => {
    serveCalendarRows([
      {
        first_aired: '2023-05-05T01:00:00.000Z',
        episode: { ...EpisodeSiloResponseMock, episode_type: 'full_season' },
        show: ShowSiloResponseMock,
      },
      {
        first_aired: '2023-05-05T02:00:00.000Z',
        episode: {
          ...EpisodeSiloResponseMock,
          ids: { ...EpisodeSiloResponseMock.ids, trakt: 5165668 },
          number: 2,
          title: "Holston's Pick",
          episode_type: 'standard',
        },
        show: ShowSiloResponseMock,
      },
    ]);

    const region = await renderSection(SECTION);

    const group = await within(region).findByRole('group', {
      name: 'Friday 5 May',
    });
    expect(within(group).getAllByRole('heading', { level: 5 })).toHaveLength(2);
    expect(within(group).getByRole('link', { name: 'Season 1' }))
      .toBeVisible();
    expect(within(group).queryByText(/premiere|finale/i)).toBeNull();
  });

  it.each([
    [1, [['Friday 5 May', 'near']]],
    [2, [['Friday 5 May', 'near'], ['Saturday 6 May', 'near']]],
    [3, [
      ['Friday 5 May', 'near'],
      ['Saturday 6 May', 'near'],
      ['Sunday 7 May', 'far'],
    ]],
    [5, [
      ['Friday 5 May', 'near'],
      ['Saturday 6 May', 'near'],
      ['Sunday 7 May', 'far'],
      ['Monday 8 May', 'far'],
      ['Tuesday 9 May', 'far'],
    ]],
  ])(
    'should fill the near column first when %i dates hold entries',
    async (count, columns) => {
      serveCalendarRows(
        Array.from({ length: count }, (_, index) => episodeRow(5 + index)),
      );

      const region = await renderSection(SECTION);

      await within(region).findAllByRole('group');
      expect(columnsOf(region)).toEqual(columns);
    },
  );

  it('should stack one poster per show or movie of a near date, the first shown', async () => {
    serveCalendarRows(MIXED_DAY);

    const region = await renderSection(SECTION);

    const group = await within(region).findByRole('group', {
      name: 'Friday 5 May',
    });
    expect(postersOf(group)).toEqual([
      { src: SILO_POSTER, isShown: true },
      { src: DEVS_POSTER, isShown: false },
      { src: HERETIC_POSTER, isShown: false },
    ]);
  });

  it("should show a hovered entry's poster and keep it after the pointer leaves", async () => {
    const user = userEvent.setup();
    serveCalendarRows(MIXED_DAY);

    const region = await renderSection(SECTION);

    const group = await within(region).findByRole('group', {
      name: 'Friday 5 May',
    });
    const devs = within(group).getByRole('link', { name: 'Devs' });
    await user.hover(devs);
    expect(shownPosterOf(group)).toEqual([DEVS_POSTER]);

    await user.unhover(devs);
    expect(shownPosterOf(group)).toEqual([DEVS_POSTER]);

    await user.hover(within(group).getByText('Question everything.'));
    expect(shownPosterOf(group)).toEqual([HERETIC_POSTER]);

    await user.hover(
      within(group).getByRole('link', { name: "1x02 Holston's Pick" }),
    );
    expect(shownPosterOf(group)).toEqual([SILO_POSTER]);
  });

  it('should show the poster of the entry the focus moves into, and keep it on blur', async () => {
    serveCalendarRows(MIXED_DAY);

    const region = await renderSection(SECTION);

    const group = await within(region).findByRole('group', {
      name: 'Friday 5 May',
    });
    const heretic = within(group).getByRole('link', { name: 'Heretic' });
    heretic.focus();
    await tick();
    expect(heretic).toHaveFocus();
    expect(shownPosterOf(group)).toEqual([HERETIC_POSTER]);

    heretic.blur();
    await tick();
    expect(shownPosterOf(group)).toEqual([HERETIC_POSTER]);
  });

  it("should swap only the hovered date's poster", async () => {
    const user = userEvent.setup();
    serveCalendarRows([...MIXED_DAY, episodeRow(6)]);

    const region = await renderSection(SECTION);

    const friday = await within(region).findByRole('group', {
      name: 'Friday 5 May',
    });
    const saturday = within(region).getByRole('group', {
      name: 'Saturday 6 May',
    });
    await user.hover(within(friday).getByRole('link', { name: 'Devs' }));
    expect(shownPosterOf(friday)).toEqual([DEVS_POSTER]);
    expect(shownPosterOf(saturday)).toEqual([SILO_POSTER]);
  });

  it('should stack no posters for a far date', async () => {
    serveCalendarRows([episodeRow(5), episodeRow(6), episodeRow(7)]);

    const region = await renderSection(SECTION);

    const group = await within(region).findByRole('group', {
      name: 'Sunday 7 May',
    });
    expect(postersOf(group)).toEqual([]);
    expect(
      postersOf(within(region).getByRole('group', { name: 'Saturday 6 May' })),
    )
      .toEqual([{ src: SILO_POSTER, isShown: true }]);
  });

  it('should link the header to the calendar page', async () => {
    serveCalendarRows([episodeRow(5)]);

    const region = await renderSection(SECTION);

    expect(await within(region).findByRole('link', { name: 'Calendar' }))
      .toHaveAttribute('href', '/calendars');
  });

  it('should show the empty box when no date holds an entry', async () => {
    serveCalendarRows([]);

    const region = await renderSection(SECTION);

    expect(
      await within(region).findByText(
        'Nothing airing in the next three weeks.',
      ),
    ).toBeVisible();
  });
});
