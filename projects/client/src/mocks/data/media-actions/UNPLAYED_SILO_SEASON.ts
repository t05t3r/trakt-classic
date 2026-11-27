import type { QuickActionsTarget } from '$lib/features/media-actions/components/QuickActionsProps.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';
import { ShowSiloSeasonsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsMappedMock.ts';

const SEASON_TWO = assertDefined(ShowSiloSeasonsMappedMock.at(1));

// Silo's second season, of which its show's watched history holds no Play.
export const UNPLAYED_SILO_SEASON = {
  type: 'season',
  id: SEASON_TWO.id,
  title: 'Season 2 of Silo',
  number: SEASON_TWO.number,
  episodes: SEASON_TWO.episodes,
  airDate: SEASON_TWO.airDate,
  show: { id: SILO.id, title: 'Silo', slug: 'silo' },
} satisfies QuickActionsTarget;
