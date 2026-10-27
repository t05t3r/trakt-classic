import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { PersonalListsResponseMock } from '$mocks/data/users/response/PersonalListsResponseMock.ts';

export const LIST_RESPONSE = assertDefined(PersonalListsResponseMock.at(0));
