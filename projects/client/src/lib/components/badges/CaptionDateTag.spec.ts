import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { emulateHydrated } from '$test/beds/hydration/emulateHydrated.ts';
import { render, waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import CaptionDateTag from './CaptionDateTag.svelte';

const DATE = new Date('2023-06-30T01:00:00.000Z');

describe('component: CaptionDateTag', () => {
  it('should render nothing until the page has hydrated, then the date in a caption tag', async () => {
    const { container } = render(CaptionDateTag, {
      props: { date: DATE, pattern: 'd MMM yyyy HH:mm' },
    });
    expect(container.querySelector('.trakt-caption-tag')).toBeNull();

    emulateHydrated();

    await waitFor(() =>
      expect(container.querySelector('.trakt-caption-tag'))
        .toHaveTextContent('30 Jun 2023 01:00')
    );
  });

  // The mappers read a missing date as MAX_DATE.
  it.each([
    { kind: 'no', date: MAX_DATE },
    { kind: 'an invalid', date: new Date(NaN) },
  ])('should render nothing for $kind date', ({ date }) => {
    emulateHydrated();

    const { container } = render(CaptionDateTag, {
      props: { date, pattern: 'd MMM yyyy HH:mm' },
    });

    expect(container.querySelector('.trakt-caption-tag')).toBeNull();
  });
});
