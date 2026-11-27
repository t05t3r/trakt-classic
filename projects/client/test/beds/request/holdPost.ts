import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { recordBodies } from '$test/beds/request/recordBodies.ts';
import { HttpResponse } from 'msw';

// Holds each write until released, then answers it with `status` and no body.
export function holdPost(
  url: string,
  status = 201,
): Readonly<{
  requested: Promise<void>;
  release: () => void;
  bodies: ReadonlyArray<unknown>;
}> {
  const { answer, requested, release } = holdResponse(
    () => new HttpResponse(null, { status }),
  );

  return { requested, release, bodies: recordBodies(url, { answer }) };
}
