<script lang="ts" generics="T">
  type ListReaderProps<T> = { read: () => T; onread: (value: T) => void };

  const { read, onread }: ListReaderProps<T> = $props();

  // Keyed by its caller, so the value read at init serves the reader's whole life.
  // svelte-ignore state_referenced_locally
  onread(read());
</script>
