import type { RequestResponse } from '../models/ResponseDefinitions.ts';
import { isNoContentResponse } from './isNoContentResponse.ts';
import { isSuccessResponse } from './isSuccessResponse.ts';

export function isExpectedResponse<TInput>(
  response: RequestResponse<TInput>,
): boolean {
  return isSuccessResponse(response) || isNoContentResponse(response);
}
