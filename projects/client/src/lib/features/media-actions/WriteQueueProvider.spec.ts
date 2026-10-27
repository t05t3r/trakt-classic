import { sessionExpired } from '$lib/features/auth/sessionExpired.ts';
import type { WriteQueue } from '$lib/features/media-actions/_internal/createWriteQueue.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import WriteQueueHost from '$test/beds/media-actions/WriteQueueHost.svelte';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import WriteQueueProvider from './WriteQueueProvider.svelte';

const content = createRawSnippet(() => ({
  render: () => '<span>queued content</span>',
}));

function renderWriteQueue() {
  const output = vi.fn<(queue: WriteQueue) => void>();
  const { unmount } = render(WriteQueueHost, { props: { output } });
  const queue = assertDefined(
    output.mock.calls.at(0)?.at(0),
    'WriteQueueHost provided no Write Queue.',
  );

  return { queue, unmount };
}

describe('component: WriteQueueProvider', () => {
  it('should render its children', () => {
    render(WriteQueueProvider, { props: { children: content } });

    expect(screen.getByText('queued content')).toBeVisible();
  });

  it('should reject writes as session-expired once the Session expires', async () => {
    const { queue } = renderWriteQueue();

    sessionExpired.next();

    await expect(queue.enqueue(() => Promise.resolve())).rejects
      .toMatchObject({ class: 'session-expired' });
  });

  it('should stop reacting to an expired Session once destroyed', async () => {
    const { queue, unmount } = renderWriteQueue();

    unmount();
    sessionExpired.next();

    await expect(queue.enqueue(() => Promise.resolve())).resolves
      .toBeUndefined();
  });
});
