import { server } from '$mocks/server.ts';
import {
  pagedResponse,
  type PagedResponseParams,
} from '$test/beds/request/pagedResponse.ts';
import { http } from 'msw';

export function servePaged(
  { url, ...params }: { url: string } & PagedResponseParams,
): void {
  server.use(http.get(url, () => pagedResponse(params)));
}
