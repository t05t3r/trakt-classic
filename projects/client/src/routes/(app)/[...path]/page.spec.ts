import { httpErrorStatus } from '$test/beds/request/httpErrorStatus.ts';
import { describe, expect, it } from 'vitest';
import { load } from './+page.ts';

type LoadEvent = Parameters<typeof load>[0];

describe('load: unknown path', () => {
  it('should raise a 404 for a path no route matches', async () => {
    const event = { params: { path: 'nowhere/at/all' } } as LoadEvent;

    expect(await httpErrorStatus(async () => load(event))).toBe(404);
  });
});
