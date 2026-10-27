<script lang="ts">
  import { iffy } from '$lib/utils/function/iffy.ts';
  import { BehaviorSubject } from 'rxjs';
  import { setContext } from 'svelte';
  import type { Snippet } from 'svelte';
  import { PARAMETER_ESCAPE_KEY } from './_internal/PARAMETER_ESCAPE_KEY.ts';

  const { children, enabled }: { children: Snippet; enabled: boolean } = $props();
  iffy(() =>
    setContext(PARAMETER_ESCAPE_KEY, new BehaviorSubject(enabled))
  );
</script>

{@render children()}
