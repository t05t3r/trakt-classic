<script>
  import TestProvider from "$test/beds/_internal/TestProvider.svelte";

  const input = $props();
</script>

<TestProvider onUserLoaded={input.onUserLoaded}>
  <input.component {...input.componentProps} />
</TestProvider>
