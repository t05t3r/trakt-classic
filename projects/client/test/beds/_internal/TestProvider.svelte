<script lang="ts">
  import AuthProvider from '$lib/features/auth/AuthProvider.svelte';
  import { mapToAuthData } from '$lib/features/auth/mapToAuthData.ts';
  import type { Session } from '$lib/features/auth/models/Session.ts';
  import ConfirmationProvider from '$lib/features/confirmation/ConfirmationProvider.svelte';
  import { createQueryClient } from '$lib/features/query/createQueryClient.ts';
  import QueryClientProvider from '$lib/features/query/QueryClientProvider.svelte';
  import WriteQueueProvider from '$lib/features/media-actions/WriteQueueProvider.svelte';
  import ToastRegion from '$lib/sections/navbar/ToastRegion.svelte';
  import { time } from '$lib/utils/timing/time.ts';
  import type { Snippet } from 'svelte';
  import UserLoadedProbe from './UserLoadedProbe.svelte';

  const {
    children,
    onUserLoaded,
    session = {
      access: 'test-access-token',
      refresh: 'test-refresh-token',
      expiresAt: Date.now() + time.hours(1),
    },
  }: {
    children: Snippet;
    onUserLoaded?: () => void;
    session?: Session | null;
  } = $props();
</script>

<QueryClientProvider client={createQueryClient({ retryDelay: 0 })}>
  <WriteQueueProvider>
    <ConfirmationProvider>
      <AuthProvider auth={mapToAuthData(session)}>
        <ToastRegion />
        {#if onUserLoaded}
          <UserLoadedProbe onLoaded={onUserLoaded} />
        {/if}
        {@render children()}
      </AuthProvider>
    </ConfirmationProvider>
  </WriteQueueProvider>
</QueryClientProvider>
