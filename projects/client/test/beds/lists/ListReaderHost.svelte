<script lang="ts">
  import ListReader from '$lib/sections/lists/_internal/ListReader.svelte';
  import { BehaviorSubject, EMPTY, type Observable, switchMap } from 'rxjs';

  type ListReaderHostProps = { read: (key: string) => Observable<string> };

  const { read }: ListReaderHostProps = $props();

  let key = $state('a');
  let isOpen = $state(false);

  const readings = new BehaviorSubject<Observable<string> | undefined>(
    undefined,
  );
  const reading = readings.pipe(switchMap((current) => current ?? EMPTY));
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
