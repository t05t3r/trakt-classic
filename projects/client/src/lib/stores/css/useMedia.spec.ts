import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { describe, expect, it } from 'vitest';
import { useMedia } from './useMedia.ts';

const setLayout = fakeLayouts({
  desktop: null,
  mobile: WELL_KNOWN_MEDIA_QUERY.mobile,
});

describe('store: useMedia', () => {
  it('should start a first subscriber from the layout at its subscription', async () => {
    setLayout('desktop');
    const isMobile = useMedia(WELL_KNOWN_MEDIA_QUERY.mobile);
    setLayout('mobile');

    const matches = await runQuery({
      factory: () => isMobile,
      waitFor: () => true,
    });

    expect(matches).toBe(true);
  });
});
