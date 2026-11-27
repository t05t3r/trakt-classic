import type { SeasonProgress } from '$lib/requests/models/ShowProgressDetail.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { ShowSiloProgressMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloProgressMappedMock.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { hoverTooltipLines } from '$test/beds/tooltip/hoverTooltipLines.ts';
import { tooltipOf } from '$test/beds/tooltip/tooltipOf.ts';
import { within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import SeasonRegions from './SeasonRegions.svelte';
import type { SeasonRegionsProps } from './SeasonRegionsProps.ts';

const [SEASON_ONE, SEASON_TWO] = ShowSiloProgressMappedMock.seasons;

const UNWATCHED_SEASON: SeasonProgress = {
  number: 3,
  title: null,
  total: 3,
  completed: 0,
  plays: 0,
  minutesWatched: 0,
  minutesLeft: 150,
  lastWatchedAt: null,
  episodes: [1, 2, 3].map((number) => ({
    number,
    completed: false,
    lastWatchedAt: null,
  })),
};

const UNAIRED_SEASON: SeasonProgress = {
  ...UNWATCHED_SEASON,
  number: 4,
  total: 0,
  minutesLeft: 0,
  episodes: [],
};

const NEXT_IN_SEASON_TWO = { season: 2, number: 2 };

function renderRegions(
  seasons: ReadonlyArray<SeasonProgress>,
  nextEpisode: SeasonRegionsProps['nextEpisode'] = null,
) {
  const { container } = renderComponent(SeasonRegions, {
    props: { seasons, nextEpisode },
  });

  return [...container.querySelectorAll<HTMLElement>('.season-region')];
}

async function hoverRegion(region: HTMLElement | undefined) {
  stubClientRects();
  const lines = await hoverTooltipLines(assertDefined(region));

  return { lines, tooltip: tooltipOf(assertDefined(region)) };
}

describe('component: SeasonRegions', () => {
  it('should lay one region per aired season, grown by its aired episodes', () => {
    const regions = renderRegions([
      assertDefined(SEASON_ONE),
      assertDefined(SEASON_TWO),
      UNAIRED_SEASON,
    ]);

    expect(
      regions.map((region) =>
        region.style.getPropertyValue('--season-episodes')
      ),
    ).toEqual(['10', '7']);
  });

  it("should give a complete season's share, counts with its time watched and last watch, under its name, badge and bar", async () => {
    const [region] = renderRegions([assertDefined(SEASON_ONE)]);

    const { lines, tooltip } = await hoverRegion(region);

    expect(lines).toEqual([
      '100% watched',
      '10 / 10 eps — 11 plays (9h 19m)',
      'Last watched 27 Dec 2024',
    ]);
    expect(within(tooltip).getByText('Season 1')).toBeInTheDocument();
    expect(within(tooltip).getByText('Complete')).toBeInTheDocument();
    expect(tooltip.querySelector('.trakt-tick-progress-bar'))
      .toHaveAttribute('aria-valuenow', '100');
    expect(tooltip).not.toHaveTextContent(/left/);
  });

  it('should set the time watched in italics and the last day watched in bold', async () => {
    const [region] = renderRegions([assertDefined(SEASON_ONE)]);

    const { tooltip } = await hoverRegion(region);

    expect(tooltip.querySelector('i')).toHaveTextContent(/^\(9h 19m\)$/);
    expect(within(tooltip).getByText('27 Dec 2024').tagName).toBe('B');
  });

  it('should give a season not complete its time left, with no badge', async () => {
    const [region] = renderRegions([assertDefined(SEASON_TWO)]);

    const { lines, tooltip } = await hoverRegion(region);

    expect(lines).toEqual([
      '14% watched',
      '1 / 7 eps — 1 play (46m)',
      'Last watched 27 Dec 2024',
    ]);
    expect(within(tooltip).getByText('Season 2')).toBeInTheDocument();
    expect(within(tooltip).queryByText('Complete')).toBeNull();
    expect(tooltip).toHaveTextContent(/^Season 2 5h 1m \(6 eps\) left /);
  });

  it("should tag the season that holds the row's next episode with it", async () => {
    const [first, second] = renderRegions(
      [assertDefined(SEASON_ONE), assertDefined(SEASON_TWO)],
      NEXT_IN_SEASON_TWO,
    );

    const { tooltip } = await hoverRegion(second);

    expect(within(tooltip).getByText('Up next 2x02')).toBeInTheDocument();

    await userEvent.unhover(assertDefined(second));
    const { tooltip: other } = await hoverRegion(first);

    expect(within(other).queryByText(/Up next/)).toBeNull();
  });

  it('should read complete, not up next, in a caught-up season whose next episode has not aired', async () => {
    const [region] = renderRegions([assertDefined(SEASON_ONE)], {
      season: 1,
      number: 11,
    });

    const { tooltip } = await hoverRegion(region);

    expect(within(tooltip).getByText('Complete')).toBeInTheDocument();
    expect(within(tooltip).queryByText(/Up next/)).toBeNull();
  });

  it('should give a season with nothing watched its count alone, over an empty bar', async () => {
    const [region] = renderRegions([UNWATCHED_SEASON]);

    const { lines, tooltip } = await hoverRegion(region);

    expect(lines).toEqual(['0 / 3 watched']);
    expect(within(tooltip).getByText('Season 3')).toBeInTheDocument();
    expect(within(tooltip).queryByText('Complete')).toBeNull();
    expect(tooltip.querySelector('.trakt-tick-progress-bar'))
      .toHaveAttribute('aria-valuenow', '0');
  });
});
