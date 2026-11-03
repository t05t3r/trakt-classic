import { WATCHED_MOVIES_URL } from '$mocks/data/users/WATCHED_MOVIES_URL.ts';
import { serveHeaderlessPages } from '$test/beds/request/serveHeaderlessPages.ts';

const PLAYED_AT = '2024-12-27T16:15:28.000Z';

// Answers the watched movies with one play of each movie given, and none of any other.
export function serveMoviePlays(ids: ReadonlyArray<number>) {
  serveHeaderlessPages({
    url: WATCHED_MOVIES_URL,
    pages: [Object.fromEntries(ids.map((id) => [id, [PLAYED_AT]]))],
  });
}
