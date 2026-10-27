import { error as printError } from '$lib/utils/console/error.ts';
import type { RequestResponse } from '../models/ResponseDefinitions.ts';
import { isExpectedResponse } from './isExpectedResponse.ts';

type StatusResponse = { status: number };

function toDetail(
  responses: ReadonlyArray<StatusResponse>,
): StatusResponse {
  const failed = responses.find((response) => !isExpectedResponse(response)) ??
    responses.at(0);

  return { status: failed?.status ?? 0 };
}

// FIXME: extend with error schemas
export class FetchError<TInput> extends Error {
  readonly detail: StatusResponse;

  constructor(public response: RequestResponse<TInput>, message: string) {
    super(message);

    printError(message);

    const responses: ReadonlyArray<StatusResponse> = Array.isArray(response)
      ? response
      : [response];
    this.detail = toDetail(responses);
  }
}
