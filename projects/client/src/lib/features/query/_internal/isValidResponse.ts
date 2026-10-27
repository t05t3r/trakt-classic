import type { InputWithStatus } from '../models/ResponseDefinitions.ts';
import { FetchError } from './FetchError.ts';
import { isExpectedResponse } from './isExpectedResponse.ts';
import { isSuccessResponse } from './isSuccessResponse.ts';

export function isValidResponse<TInput>(
  response: InputWithStatus<TInput, number>,
  key?: string,
): response is InputWithStatus<TInput, 200> {
  if (!isExpectedResponse(response)) {
    throw new FetchError(
      response,
      `Failed to fetch data: ${key}`,
    );
  }

  return isSuccessResponse(response);
}
