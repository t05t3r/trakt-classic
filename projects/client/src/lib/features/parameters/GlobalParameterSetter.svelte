<script lang="ts">
  import { iffy } from '$lib/utils/function/iffy.ts';
  import { BehaviorSubject } from 'rxjs';
  import { setContext } from 'svelte';
  import type { Snippet } from 'svelte';
  import { PARAMETER_SETTER_CONTEXT_KEY } from './_internal/PARAMETER_SETTER_CONTEXT_KEY.ts';
  import { useParameters } from './useParameters.ts';

  const { children, parameter }: { children: Snippet; parameter: string } =
    $props();
  useParameters();
  iffy(() =>
    setContext(PARAMETER_SETTER_CONTEXT_KEY, new BehaviorSubject(parameter))
  );
</script>

{@render children()}
