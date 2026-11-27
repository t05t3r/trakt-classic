import { UNPLAYED_SILO_SEASON } from '$mocks/data/media-actions/UNPLAYED_SILO_SEASON.ts';
import { SILO_SEASON_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_SEASON_ACTIONS_TARGET.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloProgressMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloProgressMappedMock.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { expectDirectionalIcon } from '$test/beds/direction/expectDirectionalIcon.ts';
import { glyphClasses } from '$test/beds/menus/glyphClasses.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { countStat } from '$test/beds/stats/countStat.ts';
import { queryCountStat } from '$test/beds/stats/queryCountStat.ts';
import { waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SeasonRow from './SeasonRow.svelte';
import type { SeasonRowProps } from './SeasonRowProps.ts';
import type { ListedSeason } from './toListedSeasons.ts';

const SEASON_ONE = assertDefined(ShowSiloProgressMappedMock.seasons.at(0));
const SEASON_TWO = assertDefined(ShowSiloProgressMappedMock.seasons.at(1));

const PLAYED_ROW: ListedSeason = {
  progress: SEASON_ONE,
  target: SILO_SEASON_ACTIONS_TARGET,
  isHidden: false,
  hides: undefined,
};

async function renderRow(
  row: Partial<ListedSeason> = PLAYED_ROW,
  props: Partial<SeasonRowProps> = {},
) {
  const { container, userLoaded } = renderComponent(SeasonRow, {
    props: {
      row: { ...PLAYED_ROW, ...row },
      show: ShowSiloMappedMock,
      isExpanded: false,
      controls: 'season-episodes',
      ontoggle: () => {},
      ...props,
    },
  });
  await userLoaded;

  return assertDefined(
    container.querySelector<HTMLElement>('.trakt-season-row'),
  );
}

const head = (row: HTMLElement) =>
  assertDefined(row.querySelector('.season-head'));

describe('component: SeasonRow', () => {
  beforeEach(() => {
    stubClientRects();
  });

  it('should link the season to its page by its number', async () => {
    const row = await renderRow();

    expect(within(row).getByRole('link', { name: 'Season 1' }))
      .toHaveAttribute('href', '/shows/silo/seasons/1');
  });

  it("should count the season's watched of its aired episodes, with the time and episodes left", async () => {
    await renderRow({ progress: SEASON_TWO, target: undefined });

    expect(countStat('watched')).toHaveTextContent(/^1 \/ 7 watched$/);
    expect(countStat('left')).toHaveTextContent(/^5h 1m \(6 eps\) left$/);
  });

  it('should fill its small bar, its percentage beside it', async () => {
    const row = await renderRow({ progress: SEASON_TWO, target: undefined });

    const bar = within(row).getByRole('progressbar', {
      name: '1 of 7 episodes watched',
    });
    expect(bar).toHaveAttribute('data-size', 'sm');
    expect(bar).toHaveAttribute('aria-valuenow', '14');
    expect(row.querySelector('.percentage-bar-value'))
      .toHaveTextContent(/^14%$/);
  });

  it('should leave the time left out of a watched season', async () => {
    await renderRow();

    expect(queryCountStat('left')).toBeNull();
  });

  it("should give the season's own title after its link", async () => {
    const row = await renderRow({
      progress: { ...SEASON_ONE, title: 'Series 1' },
      target: SILO_SEASON_ACTIONS_TARGET,
    });

    const link = within(row).getByRole('link', { name: 'Season 1' });
    expect(link.nextElementSibling).toHaveTextContent(/^Series 1$/);
  });

  it('should draw the menu it is given after its label', async () => {
    const menu = createRawSnippet(() => ({
      render: () => '<button type="button">Season 1 actions</button>',
    }));
    const row = await renderRow(PLAYED_ROW, { menu });

    expect(
      within(row).getByRole('link', { name: 'Season 1' }).nextElementSibling,
    )
      .toBe(within(row).getByRole('button', { name: 'Season 1 actions' }));
  });

  it('should read a hidden season dimmed, with a Hidden badge', async () => {
    const row = await renderRow({ isHidden: true });

    expect(row).toHaveClass('is-hidden');
    const badge = within(row).getByText('Hidden');
    expect(glyphClasses(badge)).toEqual([
      expect.stringContaining('tabler-icon-ban'),
    ]);
  });

  it('should show no Hidden badge on a shown season', async () => {
    const row = await renderRow();

    expect(row).not.toHaveClass('is-hidden');
    expect(within(row).queryByText('Hidden')).toBeNull();
  });

  it('should offer no watch toggle, only its episodes toggle', async () => {
    const row = await renderRow();

    expect(
      within(row).getAllByRole('button').map((button) =>
        button.getAttribute('aria-label')
      ),
    ).toEqual(['Episodes of season 1']);
  });

  it('should open its episodes from a toggle before its link', async () => {
    const ontoggle = vi.fn();
    const row = await renderRow(PLAYED_ROW, { ontoggle });

    const toggle = within(row).getByRole('button', {
      name: 'Episodes of season 1',
    });
    expect(head(row).firstElementChild).toBe(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'season-episodes');
    expect(glyphClasses(toggle)).toEqual([
      expect.stringContaining('tabler-icon-chevron-right'),
    ]);
    expectDirectionalIcon(assertDefined(toggle.querySelector('svg')));
    await userEvent.hover(toggle);
    await waitFor(() =>
      expect(toggle).toHaveAccessibleDescription('Episodes of season 1')
    );

    await userEvent.click(toggle);

    expect(ontoggle).toHaveBeenCalledOnce();
  });

  it('should read its toggle expanded, its caret down, while its episodes are open', async () => {
    const row = await renderRow(PLAYED_ROW, { isExpanded: true });

    const toggle = within(row).getByRole('button', {
      name: 'Episodes of season 1',
    });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(glyphClasses(toggle)).toEqual([
      expect.stringContaining('tabler-icon-chevron-down'),
    ]);
  });

  it('should count only its announced episodes, with no toggle, for a season with no aired episode', async () => {
    const row = await renderRow({
      progress: { ...SEASON_ONE, total: 0, completed: 0, episodes: [] },
      target: {
        ...SILO_SEASON_ACTIONS_TARGET,
        episodes: { count: 1, aired: 0 },
      },
    });

    expect(countStat('announced')).toHaveTextContent(/^1 announced$/);
    expect(queryCountStat('watched')).toBeNull();
    expect(within(row).queryByRole('button')).toBeNull();
  });

  it('should count its announced episodes after its watched and left', async () => {
    await renderRow({
      progress: SEASON_TWO,
      target: { ...UNPLAYED_SILO_SEASON, episodes: { count: 10, aired: 7 } },
    });

    expect(countStat('watched')).toHaveTextContent(/^1 \/ 7 watched$/);
    expect(countStat('announced')).toHaveTextContent(/^3 announced$/);
  });

  it('should count no announced episode on a season whose episodes have all aired', async () => {
    await renderRow();

    expect(queryCountStat('announced')).toBeNull();
  });

  it("should hold its toggle's place, hidden, before its link for a season with no aired episode", async () => {
    const row = await renderRow({
      progress: { ...SEASON_ONE, total: 0, completed: 0, episodes: [] },
      target: SILO_SEASON_ACTIONS_TARGET,
    });

    const placeholder = head(row).firstElementChild;
    expect(placeholder).toHaveClass('season-toggle-placeholder');
    expect(placeholder).toHaveAttribute('aria-hidden', 'true');
    expect(placeholder).toBeEmptyDOMElement();
    expect(placeholder?.nextElementSibling).toBe(
      within(row).getByRole('link', { name: 'Season 1' }),
    );
  });
});
