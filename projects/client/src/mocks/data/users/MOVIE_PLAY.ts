import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { MovieActivityHistoryMappedMock } from '$mocks/data/users/mapped/MovieActivityHistoryMappedMock.ts';

export const MOVIE_PLAY = assertDefined(MovieActivityHistoryMappedMock.at(0));
