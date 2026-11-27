import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { SILO_PROGRESS_URL } from '$mocks/data/shows/SILO_PROGRESS_URL.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloProgressMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloProgressMappedMock.ts';
import { ShowSiloProgressHiddenSeasonTwoResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressHiddenSeasonTwoResponseMock.ts';
import { ShowSiloProgressResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressResponseMock.ts';
import { DEVS_WATCHED_PROGRESS } from '$mocks/data/sync/DEVS_WATCHED_PROGRESS.ts';
import { DROPPED_AT } from '$mocks/data/users/DROPPED_AT.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { fixNow } from '$test/beds/date/fixNow.ts';
import { controlledBy } from '$test/beds/dom/controlledBy.ts';
import { emulateHydrated } from '$test/beds/hydration/emulateHydrated.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { openSeasons } from '$test/beds/progress/openSeasons.ts';
import { serveSiloHidingSeasonTwo } from '$test/beds/progress/serveSiloHidingSeasonTwo.ts';
import { serveSiloProgress } from '$test/beds/progress/serveSiloProgress.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { HIDE_PROGRESS_URL } from '$mocks/data/users/HIDE_PROGRESS_URL.ts';
import { HiddenSeasonsResponseMock } from '$mocks/data/users/response/HiddenSeasonsResponseMock.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { hoverTooltipLines } from '$test/beds/tooltip/hoverTooltipLines.ts';
import { tooltipOf } from '$test/beds/tooltip/tooltipOf.ts';
import { barRuns } from '$test/beds/progress/barRuns.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { failOnce } from '$test/beds/request/failOnce.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { controlViewport } from '$test/beds/viewport/controlViewport.ts';
import { waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import ProgressRow from './ProgressRow.svelte';
import type { ProgressRowProps } from './ProgressRowProps.ts';

const viewport = controlViewport();

// Its counts and date are Silo's own progress, so the cached flags agree with the row.
const SILO_ROW: ProgressRowProps['row'] = {
  ...DEVS_WATCHED_PROGRESS,
  show: ShowSiloMappedMock,
  total: ShowSiloProgressMappedMock.total,
  completed: ShowSiloProgressMappedMock.completed,
  remaining: ShowSiloProgressMappedMock.total -
    ShowSiloProgressMappedMock.completed,
  lastWatchedAt: ShowSiloProgressMappedMock.lastWatchedAt,
};

async function renderRowToUpdate(props: Partial<ProgressRowProps> = {}) {
  const { container, userLoaded, rerender } = renderComponent(ProgressRow, {
    props: { row: DEVS_WATCHED_PROGRESS, ...props },
  });
  await userLoaded;
  const row = assertDefined(
    container.querySelector<HTMLElement>('.trakt-progress-row'),
  );

  return { row, rerender };
}

const renderRow = async (props: Partial<ProgressRowProps> = {}) =>
  (await renderRowToUpdate(props)).row;

// Silo's second season in the hidden seasons list, so a row of Silo reads its own progress once in view.
const listSiloHidingSeasonTwo = () =>
  servePaged({ url: HIDE_PROGRESS_URL, body: HiddenSeasonsResponseMock });

// Brings the row into view and waits out its progress's answer, for a check that nothing changed.
async function enterAndRead(row: HTMLElement) {
  const read = holdRequest({ method: 'get', url: SILO_PROGRESS_URL });

  viewport.enter(row);
  await read.requested;
  read.release();
  await waitNegativeClaim();
}

// The card sits in the row's own card column.
function rowCard(row: HTMLElement) {
  return assertDefined(
    row.querySelector<HTMLElement>('.row-card .trakt-fanart-card'),
  );
}

describe('component: ProgressRow', () => {
  it("should link the show's poster and title to the show", async () => {
    const row = await renderRow();

    const poster = assertDefined(row.querySelector('.row-poster'));
    expect(poster).toHaveAttribute('href', '/shows/devs');
    expect(poster.querySelector('.trakt-lazy-image .image')).toHaveAttribute(
      'src',
      DEVS_WATCHED_PROGRESS.show.poster.url.thumb,
    );
    const title = assertDefined(row.querySelector<HTMLElement>('.row-title'));
    expect(within(title).getByRole('link', { name: 'Devs' }))
      .toHaveAttribute('href', '/shows/devs');
  });

  it.each([
    { completed: 10, total: 18, percent: '55' },
    { completed: 3, total: 4, percent: '75' },
  ])(
    'should fill the bar to $completed of $total aired episodes, and print $percent%',
    async ({ completed, total, percent }) => {
      const row = await renderRow({
        row: {
          ...DEVS_WATCHED_PROGRESS,
          completed,
          total,
          remaining: total - completed,
        },
      });

      const bar = within(row).getByRole('progressbar', {
        name: `${completed} of ${total} episodes watched`,
      });
      expect(bar).toHaveAttribute('data-size', 'lg');
      expect(bar).toHaveAttribute('aria-valuenow', percent);
      expect(row.querySelector('.percentage-bar-value'))
        .toHaveTextContent(new RegExp(`^${percent}%$`));
    },
  );

  it('should size the percentage box by 100%, out of its text', async () => {
    const row = await renderRow();

    const percentage = assertDefined(
      row.querySelector('.percentage-bar-value'),
    );
    expect(percentage).toHaveAttribute('data-widest-percentage', '100%');
    expect(percentage).toHaveTextContent(/^62%$/);
  });

  it('should leave the bar empty at 0% for a show with no aired episode', async () => {
    const row = await renderRow({
      row: { ...DEVS_WATCHED_PROGRESS, total: 0, completed: 0, remaining: 0 },
    });

    expect(within(row).getByRole('progressbar'))
      .toHaveAttribute('aria-valuenow', '0');
    expect(row.querySelector('.percentage-bar-value')).toHaveTextContent(
      /^0%$/,
    );
    expect(row.querySelector('.row-no-aired'))
      .toHaveTextContent(/^No episodes have aired yet\.$/);
    expect(row.querySelector('.trakt-progress-stats')).toBeNull();
  });

  // On a phone the status menu wraps to its own line, while the year stays beside the title.
  it('should keep the year with the title, apart from the status menu', async () => {
    const row = await renderRow();

    const title = assertDefined(row.querySelector<HTMLElement>('.row-title'));
    await within(title).findByRole('button', { name: 'Watching' });
    const name = assertDefined(title.querySelector<HTMLElement>('.row-name'));
    expect(within(name).getByRole('heading', { level: 3 }))
      .toHaveAccessibleName('Devs');
    expect(name.querySelector('.row-year')).toHaveTextContent(/^2020$/);
    expect(within(name).queryByRole('button')).toBeNull();
  });

  it.each([
    { given: 'episodes left', completed: 5, status: 'Watching' },
    { given: 'every aired episode watched', completed: 8, status: 'Caught Up' },
  ])(
    "should give the show's status as $status in a menu beside its title, for $given",
    async ({ completed, status }) => {
      const row = await renderRow({
        row: {
          ...DEVS_WATCHED_PROGRESS,
          completed,
          remaining: DEVS_WATCHED_PROGRESS.total - completed,
        },
      });

      const title = assertDefined(
        row.querySelector<HTMLElement>('.row-title'),
      );
      expect(await within(title).findByRole('button', { name: status }))
        .toHaveAttribute('aria-haspopup', 'menu');
    },
  );

  it("should line up the row's stats under its bar", async () => {
    const row = await renderRow();

    const stats = assertDefined(
      row.querySelector<HTMLElement>('.row-info .trakt-progress-stats'),
    );
    expect(stats.previousElementSibling).toHaveClass('row-bar');
    expect(stats).toHaveTextContent(
      /^5 \/ 8 watched 5 plays 4h 20m watched 2h 36m \(3 eps\) left$/,
    );
  });

  it('should draw the last episode watched on its own line under its stats, above its seasons', async () => {
    const row = await renderRow();

    const pill = within(row).getByRole('link', { name: /^Last watched/ });
    expect(pill).toHaveTextContent(/^Last watched 1x05 "Episode 5"$/);
    expect(pill.previousElementSibling).toHaveClass('trakt-progress-stats');
    expect(pill.nextElementSibling).toHaveClass('trakt-seasons-controls');
  });

  it("should offer the show's seasons in a closed box, its toggle after the last episode watched", async () => {
    const row = await renderRow();

    const pill = within(row).getByRole('link', { name: /^Last watched/ });
    const toggle = within(row).getByRole('button', { name: 'Seasons' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(pill.compareDocumentPosition(toggle))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("should lay its seasons' list out in the row, between its info and its card", async () => {
    const row = await renderRow();

    const toggle = within(row).getByRole('button', { name: 'Seasons' });
    const list = assertDefined(controlledBy(toggle));
    expect(list.parentElement).toBe(row);
    expect(list.previousElementSibling).toHaveClass('row-info');
    expect(list.nextElementSibling).toHaveClass('row-card');
  });

  it("should describe its Seasons toggle by the show's title", async () => {
    const row = await renderRow();

    expect(within(row).getByRole('button', { name: 'Seasons' }))
      .toHaveAccessibleDescription('Devs');
  });

  it("should describe its status button by the show's title", async () => {
    const row = await renderRow();

    expect(within(row).getByRole('button', { name: 'Watching' }))
      .toHaveAccessibleDescription('Devs');
  });

  it("should describe its seasons' retry by the show's title", async () => {
    failOnce(SILO_PROGRESS_URL);
    const row = await renderRow({ row: SILO_ROW });

    await userEvent.click(
      within(row).getByRole('button', { name: 'Seasons' }),
    );

    expect(await within(row).findByRole('button', { name: 'Retry' }))
      .toHaveAccessibleDescription('Silo');
  });

  describe("the bar's segments", () => {
    const runsOf = (row: HTMLElement) =>
      barRuns(assertDefined(row.querySelector<HTMLElement>('.row-bar')));
    const fillsOf = (row: HTMLElement) =>
      row.querySelectorAll('.row-bar .progress-fill');

    it('should draw one fill and read no progress, in view, while its show hides no season and its progress is uncached', async () => {
      const requests = await captureRequests(async () => {
        const row = await renderRow({ row: SILO_ROW });
        viewport.enter(row);
        await waitNegativeClaim();

        expect(fillsOf(row)).toHaveLength(1);
        expect(runsOf(row)).toEqual([]);
      }, { pathIncludes: '/shows/silo/progress' });

      expect(requests).toEqual([]);
    });

    it("should draw the episodes' watched flags once its seasons box has read them", async () => {
      const row = await renderRow({ row: SILO_ROW });

      await openSeasons(row);

      await waitFor(() =>
        expect(runsOf(row)).toEqual([
          { isFilled: true, length: '11' },
          { isFilled: false, length: '6' },
        ])
      );
      expect(fillsOf(row)).toHaveLength(0);
      expect(
        within(row).getByRole('progressbar', {
          name: '11 of 17 episodes watched',
        }),
      ).toHaveAttribute('aria-valuenow', '64');
    });

    it.each([
      {
        count: 'aired',
        total: SILO_ROW.total + 1,
        completed: SILO_ROW.completed,
      },
      {
        count: 'watched',
        total: SILO_ROW.total,
        completed: SILO_ROW.completed - 1,
      },
    ])(
      "should keep one fill when the cached flags disagree with the row's $count count",
      async ({ total, completed }) => {
        const row = await renderRow({
          row: { ...SILO_ROW, total, completed, remaining: total - completed },
        });

        await openSeasons(row);
        await waitNegativeClaim();

        expect(fillsOf(row)).toHaveLength(1);
        expect(runsOf(row)).toEqual([]);
      },
    );

    it("should keep one fill when the cached flags match the row's counts but not its last watch", async () => {
      const row = await renderRow({
        row: { ...SILO_ROW, lastWatchedAt: new Date('2025-01-02T10:00:00Z') },
      });

      await openSeasons(row);
      await waitNegativeClaim();

      expect(fillsOf(row)).toHaveLength(1);
      expect(runsOf(row)).toEqual([]);
    });

    // The row's read keeps a last watch's seconds, the cached progress's only its minute.
    it.each([
      {
        case: 'the same minute',
        cached: '2024-12-27T19:40:00.000Z',
        lastWatchedAt: new Date('2024-12-27T19:40:28.000Z'),
      },
      { case: 'no last watch', cached: null, lastWatchedAt: null },
    ])(
      'should draw the flags when the row and the cached episodes were last watched at $case',
      async ({ cached, lastWatchedAt }) => {
        serveSiloProgress({
          ...ShowSiloProgressResponseMock,
          seasons: ShowSiloProgressResponseMock.seasons.map((season) => ({
            ...season,
            episodes: season.episodes.map((episode) => ({
              ...episode,
              last_watched_at: episode.completed ? cached : null,
            })),
          })),
        });
        const row = await renderRow({ row: { ...SILO_ROW, lastWatchedAt } });

        await openSeasons(row);

        await waitFor(() => expect(runsOf(row)).toHaveLength(2));
        expect(fillsOf(row)).toHaveLength(0);
      },
    );

    // The show's own last watch is its highest-numbered watched episode's, which may not be the latest.
    it("should draw the flags when the row's last watch is the latest episode watch, the show's own older", async () => {
      serveSiloProgress({
        ...ShowSiloProgressResponseMock,
        last_watched_at: '2024-12-20T08:00:00.000Z',
      });
      const row = await renderRow({ row: SILO_ROW });

      await openSeasons(row);

      await waitFor(() => expect(runsOf(row)).toHaveLength(2));
      expect(fillsOf(row)).toHaveLength(0);
    });
  });

  describe("the bar's season regions", () => {
    const regionsOf = (row: HTMLElement) => [
      ...row.querySelectorAll<HTMLElement>('.row-bar .season-region'),
    ];

    it('should lay no region over the bar while it draws one fill', async () => {
      const row = await renderRow({
        row: { ...SILO_ROW, lastWatchedAt: new Date('2025-01-02T10:00:00Z') },
      });

      await openSeasons(row);
      await waitNegativeClaim();

      expect(regionsOf(row)).toEqual([]);
    });

    it("should lay a region per season over the bar's flags, each with its season's tooltip", async () => {
      stubClientRects();
      const row = await renderRow({
        row: {
          ...SILO_ROW,
          nextEpisode: ShowSiloProgressMappedMock.nextEpisode,
        },
      });

      await openSeasons(row);

      await waitFor(() => expect(regionsOf(row)).toHaveLength(2));
      const region = assertDefined(regionsOf(row).at(1));
      expect(await hoverTooltipLines(region)).toEqual([
        '14% watched',
        '1 / 7 eps — 1 play (46m)',
        'Last watched 27 Dec 2024',
      ]);
      expect(tooltipOf(region)).toHaveTextContent(/^Season 2 Up next 2x02 /);
    });

    it("should dim the bar's ticks of every other season while one is hovered", async () => {
      const row = await renderRow({ row: SILO_ROW });
      const dimmedOf = () =>
        [...row.querySelectorAll<HTMLElement>('.progress-run.is-dimmed')].map(
          (run) => run.style.getPropertyValue('--run-length'),
        );

      await openSeasons(row);
      await waitFor(() => expect(regionsOf(row)).toHaveLength(2));
      const [first, second] = regionsOf(row);

      await userEvent.hover(assertDefined(second));

      expect(dimmedOf()).toEqual(['10']);

      await userEvent.unhover(assertDefined(second));
      await userEvent.hover(assertDefined(first));

      expect(dimmedOf()).toEqual(['1', '6']);

      await userEvent.unhover(assertDefined(first));

      await waitFor(() => expect(dimmedOf()).toEqual([]));
    });

    it('should dim nothing once the regions leave while one is hovered', async () => {
      const { row, rerender } = await renderRowToUpdate({ row: SILO_ROW });
      const hasHighlight = () =>
        row.querySelector('.row-bar .has-highlight') !== null;
      await openSeasons(row);
      await waitFor(() => expect(regionsOf(row)).toHaveLength(2));
      await userEvent.hover(assertDefined(regionsOf(row).at(1)));
      expect(hasHighlight()).toBe(true);

      rerender({ row: { ...SILO_ROW, completed: SILO_ROW.completed - 1 } });

      await waitFor(() => expect(regionsOf(row)).toEqual([]));
      expect(hasHighlight()).toBe(false);
    });
  });

  describe('a row with a hidden season', () => {
    // The row's read dates the show by the hidden season's watch.
    const HIDING_ROW: ProgressRowProps['row'] = {
      ...SILO_ROW,
      total: 10,
      completed: 10,
      remaining: 0,
      lastWatchedAt: new Date('2025-01-02T10:00:00Z'),
    };

    it("should keep its bar's flags and season regions", async () => {
      serveSiloHidingSeasonTwo();
      const row = await renderRow({ row: HIDING_ROW });

      viewport.enter(row);

      await waitFor(() =>
        expect(row.querySelectorAll('.row-bar .season-region'))
          .toHaveLength(1)
      );
    });

    it('should date its last watch by the latest one of its other seasons', async () => {
      fixNow(new Date('2025-01-02T12:00:00Z'));
      listSiloHidingSeasonTwo();
      serveSiloProgress({
        ...ShowSiloProgressHiddenSeasonTwoResponseMock,
        // Not the latest watch of the seasons it lists.
        last_watched_at: '2024-12-01T12:00:00.000Z',
      });
      const row = await renderRow({ row: HIDING_ROW });
      emulateHydrated();

      viewport.enter(row);

      await waitFor(() =>
        expect(row.querySelector('.trakt-last-watched-pill'))
          .toHaveTextContent(/ 6 days ago$/)
      );
    });

    it('should give its stats, not that nothing aired, once every season is hidden', async () => {
      listSiloHidingSeasonTwo();
      serveSiloProgress({
        ...ShowSiloProgressHiddenSeasonTwoResponseMock,
        seasons: [],
      });
      const row = await renderRow({
        row: { ...HIDING_ROW, total: 0, completed: 0 },
      });

      viewport.enter(row);

      await waitFor(() =>
        expect(row.querySelector('.trakt-progress-stats')).not.toBeNull()
      );
      expect(row.querySelector('.row-no-aired')).toBeNull();
    });
  });

  describe('the card', () => {
    it("should draw the show's next episode", async () => {
      const row = await renderRow();

      const card = rowCard(row);
      expect(card).toHaveAttribute('data-type', 'episode');
      expect(within(card).getByRole('heading', { level: 3 }))
        .toHaveTextContent('1x06 Episode 6');
    });

    it("should take the next episode from the show's progress once in view, when it hides a season", async () => {
      serveSiloHidingSeasonTwo();
      const row = await renderRow({ row: SILO_ROW });

      viewport.enter(row);

      await waitFor(() =>
        expect(rowCard(row)).toHaveAttribute('data-type', 'show')
      );
    });

    it.each([
      ['first', () => failOnce(HIDE_PROGRESS_URL)],
      [
        'second',
        () =>
          serveTwoPages({
            url: HIDE_PROGRESS_URL,
            first: [],
            second: notFound,
          }),
      ],
    ])(
      "should take the next episode from the show's progress once in view, when the hidden seasons list fails on its %s page",
      async (_, failList) => {
        failList();
        serveSiloProgress(ShowSiloProgressHiddenSeasonTwoResponseMock);
        const row = await renderRow({ row: SILO_ROW });

        viewport.enter(row);

        await waitFor(() =>
          expect(rowCard(row)).toHaveAttribute('data-type', 'show')
        );
      },
    );

    it("should keep the row's next episode when the show's progress hides no season", async () => {
      listSiloHidingSeasonTwo();
      const row = await renderRow({ row: SILO_ROW });

      await enterAndRead(row);

      expect(within(rowCard(row)).getByRole('heading', { level: 3 }))
        .toHaveTextContent('1x06 Episode 6');
    });

    it('should draw the show itself when every aired episode is watched, even with an episode next', async () => {
      const row = await renderRow({
        row: {
          ...DEVS_WATCHED_PROGRESS,
          completed: DEVS_WATCHED_PROGRESS.total,
          remaining: 0,
        },
      });

      expect(rowCard(row)).toHaveAttribute('data-type', 'show');
    });

    it('should draw the show itself when no episode is next', async () => {
      const row = await renderRow({
        row: { ...DEVS_WATCHED_PROGRESS, nextEpisode: null },
      });

      const card = rowCard(row);
      expect(card).toHaveAttribute('data-type', 'show');
      expect(within(card).getByRole('heading', { level: 3 }))
        .toHaveTextContent('Devs');
    });
  });

  it.each([
    { isFaded: true, faded: true },
    { isFaded: false, faded: false },
    { isFaded: undefined, faded: false },
  ])(
    'should fade the row when isFaded is $isFaded',
    async ({ isFaded, faded }) => {
      const row = await renderRow({ isFaded });

      expect(row.classList.contains('is-faded')).toBe(faded);
    },
  );

  describe('a dropped row', () => {
    it('should show no badge and no greyscale for a row not dropped', async () => {
      const row = await renderRow();

      expect(row.querySelector('.row-poster .trakt-dropped-badge'))
        .toBeNull();
      expect(row.classList.contains('is-dropped')).toBe(false);
    });

    it('should badge the poster with the date and time it was dropped', async () => {
      stubClientRects();
      const row = await renderRow({ droppedAt: DROPPED_AT });

      const poster = assertDefined(
        row.querySelector<HTMLElement>('.row-poster'),
      );
      // The poster link is hidden from assistive tech, the badge with it.
      const badge = within(poster).getByRole('img', {
        name: 'Dropped on 1 Feb 2024 12:00',
        hidden: true,
      });
      await userEvent.hover(badge);
      await waitFor(() =>
        expect(badge).toHaveAccessibleDescription('Dropped on 1 Feb 2024 12:00')
      );
    });

    it('should grey the poster out', async () => {
      const row = await renderRow({ droppedAt: DROPPED_AT });

      expect(row.classList.contains('is-dropped')).toBe(true);
    });

    it('should give the day it was dropped in its status, once hydrated', async () => {
      const row = await renderRow({ droppedAt: DROPPED_AT });
      const title = assertDefined(
        row.querySelector<HTMLElement>('.row-title'),
      );

      expect(await within(title).findByRole('button', { name: 'Dropped' }))
        .toBeVisible();

      emulateHydrated();

      expect(
        await within(title).findByRole('button', {
          name: 'Dropped 1 Feb 2024',
        }),
      ).toBeVisible();
    });

    it('should draw a complete dropped show with its badge, its status and the show card', async () => {
      const row = await renderRow({
        row: {
          ...DEVS_WATCHED_PROGRESS,
          completed: DEVS_WATCHED_PROGRESS.total,
          remaining: 0,
          nextEpisode: null,
        },
        droppedAt: DROPPED_AT,
      });

      expect(row.querySelector('.row-poster .trakt-dropped-badge'))
        .not.toBeNull();
      expect(within(row).getByRole('progressbar'))
        .toHaveAttribute('aria-valuenow', '100');
      expect(row.querySelector('.trakt-progress-stats'))
        .not.toHaveTextContent(/left$/);
      expect(rowCard(row)).toHaveAttribute('data-type', 'show');
      expect(await within(row).findByRole('button', { name: 'Dropped' }))
        .toBeVisible();
    });
  });
});
