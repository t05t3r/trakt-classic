import { mockRequestEvent } from '$test/request/mockRequestEvent.ts';
import type { ResolveOptions } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { handle } from './handle.ts';

const serializedHeaderFilter = async () => {
  const event = mockRequestEvent({
    url: 'http://localhost/movies/heretic-2024',
  });
  const captured: ResolveOptions[] = [];

  await handle({
    event,
    resolve: (_event, options) => {
      captured.push(options ?? {});
      return new Response();
    },
  });

  return captured.at(0)?.filterSerializedResponseHeaders;
};

describe('handle: serialized load responses', () => {
  it('should let the content type through to a load fetch', async () => {
    const filter = await serializedHeaderFilter();

    expect(filter?.('content-type', 'application/json')).toBe(true);
  });

  it.each(['set-cookie', 'x-pagination-page', 'etag'])(
    'should keep the %s header out',
    async (name) => {
      const filter = await serializedHeaderFilter();

      expect(filter?.(name, 'value')).toBe(false);
    },
  );
});
