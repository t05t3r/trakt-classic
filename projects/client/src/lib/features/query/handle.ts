import type { Handle } from '@sveltejs/kit';

// The API client reads every response's content type, and SvelteKit throws on a header it does not serialize.
export const handle: Handle = ({ event, resolve }) =>
  resolve(event, {
    filterSerializedResponseHeaders: (name) => name === 'content-type',
  });
