import { createQueryClient } from '$lib/features/query/createQueryClient.ts';
import {
  type MockRequestEvent,
  mockRequestEvent,
} from '$test/request/mockRequestEvent.ts';

type MockLoadEventProps<E> = {
  // Only types the event, so a spec needs no cast.
  load: (event: E) => unknown;
  params: Record<string, string | undefined>;
  url?: string;
};

export function mockLoadEvent<E>(
  { params, url = 'http://localhost' }: MockLoadEventProps<E>,
) {
  const queryClient = createQueryClient({ retryDelay: 0 });
  const event = {
    ...mockRequestEvent({ url }),
    params,
    parent: () => Promise.resolve({ queryClient }),
  } as unknown as E & Pick<MockRequestEvent, 'trackedUrlReads'>;

  return { event, queryClient };
}
