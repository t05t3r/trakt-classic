import type { QuickActionsTarget } from '$lib/features/media-actions/components/QuickActionsProps.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { AIRED } from '$mocks/data/media-actions/AIRED.ts';
import { DEVS } from '$mocks/data/media-actions/DEVS.ts';
import { ShowDevsProgressMappedMock } from '$mocks/data/summary/shows/devs/mapped/ShowDevsProgressMappedMock.ts';
import { ShowDevsSeasonEpisodesMappedMock } from '$mocks/data/summary/shows/devs/mapped/ShowDevsSeasonEpisodesMappedMock.ts';

const DEVS_PROGRESS_SEASON = assertDefined(
  ShowDevsProgressMappedMock.seasons.at(0),
);

// Unrated; its show's watched history holds ten plays of its eight aired episodes.
export const DEVS_SEASON_ACTIONS_TARGET = {
  type: 'season',
  id: 1001,
  title: 'Season 1 of Devs',
  number: DEVS_PROGRESS_SEASON.number,
  episodes: {
    count: ShowDevsSeasonEpisodesMappedMock.length,
    aired: DEVS_PROGRESS_SEASON.total,
  },
  airDate: AIRED,
  show: { id: DEVS.id, title: 'Devs' },
} satisfies QuickActionsTarget;
