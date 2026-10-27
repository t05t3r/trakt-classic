<script lang="ts">
  import TestProvider from "$test/beds/_internal/TestProvider.svelte";
  import type { Session } from '$lib/features/auth/models/Session.ts';
  import StoreRunner from "$test/beds/store/_internal/StoreRunner.svelte";

  const {
    factory,
    output,
    session,
  }: {
    factory: () => unknown;
    output: (value: unknown) => void;
    session?: Session | null;
  } = $props();
</script>

<!-- TODO: add more providers here as we expand test suite -->
<TestProvider {session}>
  <StoreRunner {factory} {output} />
</TestProvider>
