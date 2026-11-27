<script lang="ts">
  import { hint } from '$lib/components/tooltip/hint.svelte.ts';
  import { mapToAuthData } from '$lib/features/auth/mapToAuthData.ts';
  import type { AuthData } from '$lib/features/auth/models/AuthData.ts';
  import type { QueryClient } from '@tanstack/query-core';
  import type { Component, Snippet } from 'svelte';

  type RootData = { queryClient: QueryClient };
  type AppData = RootData & { auth: AuthData };

  type LayoutHintHostProps = {
    root: Component<{ data: RootData; children: Snippet }>;
    app: Component<{ data: AppData; children: Snippet }>;
    queryClient: QueryClient;
  };

  // The layouts come in as props, since no alias reaches `src/routes`.
  const { root: Root, app: App, queryClient }: LayoutHintHostProps = $props();
</script>

<Root data={{ queryClient }}>
  <App data={{ queryClient, auth: mapToAuthData(null) }}>
    <p {@attach hint(() => ({ content: 'The whole page' }))}>Page</p>
  </App>
</Root>
