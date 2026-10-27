import { describe, expect, it } from 'vitest';
import { GET } from './+server.ts';

describe('GET /healthz', () => {
  it('should return an ungated no-store health response', async () => {
    const response = await GET({} as Parameters<typeof GET>[0]);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('content-type')).toBe('text/plain');
  });
});
