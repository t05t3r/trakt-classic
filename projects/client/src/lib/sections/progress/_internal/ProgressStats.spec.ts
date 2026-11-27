import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { hoverTooltipLines } from '$test/beds/tooltip/hoverTooltipLines.ts';
import { screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ProgressStats from './ProgressStats.svelte';
import type { ProgressStatsProps } from './ProgressStatsProps.ts';

const SHOW: ProgressStatsProps = {
  completed: 5,
  total: 8,
  minutesLeft: 156,
  watched: { plays: 5, minutes: 260 },
};

function renderStats(props: ProgressStatsProps) {
  const { container } = renderComponent(ProgressStats, { props });

  return container;
}

describe('component: ProgressStats', () => {
  it('should line up the watched share, the plays, the time watched and the time left', () => {
    const stats = renderStats(SHOW);

    expect(stats).toHaveTextContent(
      /^5 \/ 8 watched 5 plays 4h 20m watched 2h 36m \(3 eps\) left$/,
    );
  });

  it('should count one play and one episode left in the singular', () => {
    const stats = renderStats({
      completed: 1,
      total: 2,
      minutesLeft: 57,
      watched: { plays: 1, minutes: 57 },
    });

    expect(stats).toHaveTextContent(
      /^1 \/ 2 watched 1 play 57m watched 57m \(1 ep\) left$/,
    );
  });

  it('should give the episodes left alone when Trakt gives no time', () => {
    const stats = renderStats({ ...SHOW, minutesLeft: 0 });

    expect(stats).toHaveTextContent(/ 3 eps left$/);
  });

  it('should leave the time left out once every aired episode is watched', () => {
    const stats = renderStats({ ...SHOW, completed: 8, minutesLeft: 0 });

    expect(stats).toHaveTextContent(/^8 \/ 8 watched 5 plays 4h 20m watched$/);
  });

  it("should leave the plays and the time watched out of a season's line", () => {
    const stats = renderStats({ completed: 2, total: 3, minutesLeft: 90 });

    expect(stats).toHaveTextContent(/^2 \/ 3 watched 1h 30m \(1 ep\) left$/);
  });

  it('should draw the watched share as a pie', () => {
    const stats = renderStats(SHOW);

    expect(stats.querySelector('.trakt-share-pie .pie-share'))
      .toHaveAttribute('stroke-dasharray', '62.5 100');
  });

  it('should name the watched share in its tooltip', async () => {
    stubClientRects();
    renderStats(SHOW);

    const share = assertDefined(screen.getByText('5 / 8').parentElement);
    expect(await hoverTooltipLines(share))
      .toEqual(['Episodes watched']);
  });

  it('should name the plays in their tooltip', async () => {
    stubClientRects();
    renderStats(SHOW);

    const plays = assertDefined(screen.getByText('5').parentElement);
    expect(await hoverTooltipLines(plays)).toEqual(['Plays']);
  });

  it('should name the time watched in its tooltip', async () => {
    stubClientRects();
    renderStats(SHOW);

    const timeWatched = assertDefined(
      screen.getByText('4h 20m').closest('.trakt-count-stat'),
    );
    expect(await hoverTooltipLines(timeWatched)).toEqual(['Time watched']);
  });

  it("should show the toolbar's time left lines in the time left's tooltip", async () => {
    stubClientRects();
    renderStats(SHOW);

    const timeLeft = assertDefined(
      screen.getByText('2h 36m').closest('.trakt-count-stat'),
    );
    expect(await hoverTooltipLines(timeLeft))
      .toEqual(['Time left to watch', '3 episodes']);
  });
});
