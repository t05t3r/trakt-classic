import type { SeasonProgressRow } from '$lib/features/progress/stores/useShowProgressDetail.ts';
import { SILO_SEASON_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_SEASON_ACTIONS_TARGET.ts';
import { ShowSiloProgressMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloProgressMappedMock.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { describe, expect, it } from 'vitest';
import { toListedSeasons } from './toListedSeasons.ts';

const PROGRESS = assertDefined(ShowSiloProgressMappedMock.seasons.at(0));

const seasonRow = (number: number, id?: number): SeasonProgressRow => ({
  progress: { ...PROGRESS, number },
  target: id === undefined
    ? undefined
    : { ...SILO_SEASON_ACTIONS_TARGET, id, number },
});

const numbersOf = (rows: ReadonlyArray<{ progress: { number: number } }>) =>
  rows.map(({ progress }) => progress.number);

describe('util: toListedSeasons', () => {
  it('should list the read seasons, none hidden, when none is hidden', () => {
    const listed = toListedSeasons({
      rows: [seasonRow(1, 11), seasonRow(2, 12)],
      withHidden: [],
      hiddenNumbers: new Set(),
      showsHidden: false,
    });

    expect(numbersOf(listed)).toEqual([1, 2]);
    expect(listed.map(({ isHidden }) => isHidden)).toEqual([false, false]);
  });

  it('should leave a hidden season out while the hidden seasons are not shown', () => {
    const listed = toListedSeasons({
      rows: [seasonRow(1, 11), seasonRow(2, 12), seasonRow(3, 13)],
      withHidden: [],
      hiddenNumbers: new Set([2]),
      showsHidden: false,
    });

    expect(numbersOf(listed)).toEqual([1, 3]);
  });

  it('should add the hidden seasons in their place, marked, while they are shown', () => {
    const listed = toListedSeasons({
      rows: [seasonRow(1, 11), seasonRow(3, 13)],
      withHidden: [seasonRow(1, 11), seasonRow(2, 12), seasonRow(3, 13)],
      hiddenNumbers: new Set([2]),
      showsHidden: true,
    });

    expect(numbersOf(listed)).toEqual([1, 2, 3]);
    expect(listed.map(({ isHidden }) => isHidden)).toEqual([
      false,
      true,
      false,
    ]);
  });

  it('should add a season the read leaves out but that is no longer hidden, in its place, while the hidden seasons are not shown', () => {
    const listed = toListedSeasons({
      rows: [seasonRow(1, 11), seasonRow(3, 13)],
      withHidden: [seasonRow(2, 12)],
      hiddenNumbers: new Set(),
      showsHidden: false,
    });

    expect(numbersOf(listed)).toEqual([1, 2, 3]);
    expect(listed.map(({ isHidden }) => isHidden)).toEqual([
      false,
      false,
      false,
    ]);
  });

  it('should hide a season with the later shown ones, skipping a hidden one', () => {
    const listed = toListedSeasons({
      rows: [seasonRow(1, 11), seasonRow(2, 12), seasonRow(3, 13)],
      withHidden: [],
      hiddenNumbers: new Set([2]),
      showsHidden: false,
    });

    expect(listed.at(0)?.hides).toEqual({
      season: { number: 1, id: 11 },
      later: [{ number: 3, id: 13 }],
    });
    expect(listed.at(1)?.hides).toEqual({
      season: { number: 3, id: 13 },
      later: [],
    });
  });

  it('should give a season no hides until its ids load', () => {
    const listed = toListedSeasons({
      rows: [seasonRow(1), seasonRow(2)],
      withHidden: [],
      hiddenNumbers: new Set(),
      showsHidden: false,
    });

    expect(listed.map(({ hides }) => hides)).toEqual([undefined, undefined]);
  });
});
