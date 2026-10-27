import { setupServer } from 'msw/node';
import { auth } from '$mocks/handlers/auth.ts';
import { calendars } from '$mocks/handlers/calendars.ts';
import { comments } from '$mocks/handlers/comments.ts';
import { images } from '$mocks/handlers/images.ts';
import { lists } from '$mocks/handlers/lists.ts';
import { movies } from '$mocks/handlers/movies.ts';
import { people } from '$mocks/handlers/people.ts';
import { recommendations } from '$mocks/handlers/recommendations.ts';
import { search } from '$mocks/handlers/search.ts';
import { shows } from '$mocks/handlers/shows.ts';
import { sync } from '$mocks/handlers/sync.ts';
import { users } from '$mocks/handlers/users.ts';
import { watchNow } from '$mocks/handlers/watchNow.ts';

const handlers = [
  ...auth,
  ...users,
  ...movies,
  ...shows,
  ...sync,
  ...people,
  ...watchNow,
  ...recommendations,
  ...calendars,
  ...search,
  ...lists,
  ...comments,
  ...images,
];

export const server = setupServer(...handlers);
