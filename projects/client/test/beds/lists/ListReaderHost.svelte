<script lang="ts">
  import ListReader from '$lib/sections/lists/ListReader.svelte';
  import { createKeyedReader } from '$lib/utils/store/createKeyedReader.ts';
  import { EMPTY, type Observable } from 'rxjs';

  type ListReaderHostProps = { read: (key: string) => Observable<string> };

  const { read }: ListReaderHostProps = $props();

  let key = $state('a');
  let isOpen = $state(false);

  const { latest: readings, reading } = createKeyedReader<
    Observable<string> | undefined,
    string
  >({ initial: undefined, read: (current) => current ?? EMPTY });
</script>

<button type="button" onclick={() => (isOpen = !isOpen)}>
  {isOpen ? 'Open' : 'Closed'}
</button>
<button type="button" onclick={() => (key = key === 'a' ? 'b' : 'a')}>
  Rekey
</button>
<output>{$reading}</output>

{#key key}
  <ListReader read={() => read(key)} onread={(next) => readings.next(next)} />
{/key}
