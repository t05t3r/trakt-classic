<script lang="ts">
  import type { Observable } from "rxjs";
  import TestProvider from "$test/beds/_internal/TestProvider.svelte";
  import QueryRunner from "$test/beds/query/_internal/QueryRunner.svelte";

  const {
    factory,
    output,
    mapper,
    waitFor,
  }: {
    factory: () => Observable<unknown>;
    output: (value: unknown) => void;
    mapper?: (response: unknown) => unknown;
    waitFor?: (response: unknown) => boolean;
  } = $props();
</script>

<TestProvider>
  <QueryRunner {factory} {output} {mapper} {waitFor} />
</TestProvider>
