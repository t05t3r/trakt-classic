import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { ShowSiloSeasonsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsResponseMock.ts';
import { describe, expect, it } from 'vitest';
import { mapToSeason } from './mapToSeason.ts';

const SILO_SEASON_ONE = assertDefined(ShowSiloSeasonsResponseMock.at(0));

describe('mapToSeason', () => {
  it("should carry the season's vote count", () => {
    expect(mapToSeason(SILO_SEASON_ONE).votes).toBe(SILO_SEASON_ONE.votes);
  });

  it('should read a season with no vote count as null', () => {
    const { votes: _, ...unvoted } = SILO_SEASON_ONE;

    expect(mapToSeason(unvoted).votes).toBeNull();
  });
});
