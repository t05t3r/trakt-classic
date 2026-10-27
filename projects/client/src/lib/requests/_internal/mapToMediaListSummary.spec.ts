import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { SiloListsMappedMock } from '$mocks/data/summary/shows/silo/mapped/SiloListsMappedMock.ts';
import { SiloListsResponseMock } from '$mocks/data/summary/shows/silo/response/SiloListsResponseMock.ts';
import { describe, expect, it } from 'vitest';
import { mapToMediaListSummary } from './mapToMediaListSummary.ts';

const SILOS = assertDefined(SiloListsResponseMock.at(0));
const SILOS_MAPPED = assertDefined(SiloListsMappedMock.at(0));

describe('mapToMediaListSummary', () => {
  it('should map a list with every poster the API sends', () => {
    expect(mapToMediaListSummary(SILOS)).toEqual(SILOS_MAPPED);
  });

  it('should keep one poster per image when the API repeats one', () => {
    const posters = SILOS.images?.posters ?? [];
    const first = assertDefined(posters.at(0));
    const second = assertDefined(posters.at(1));

    const mapped = mapToMediaListSummary({
      ...SILOS,
      images: { posters: [first, second, first, second] },
    });

    expect(mapped.posters).toEqual(SILOS_MAPPED.posters.slice(0, 2));
  });
});
