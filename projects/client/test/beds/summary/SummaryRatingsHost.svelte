<script lang="ts">
  import { useInvalidator } from '$lib/features/query/useInvalidator.ts';
  import SummaryRatings from '$lib/sections/summary/SummaryRatings.svelte';
  import type { SummaryRatingsProps } from '$lib/sections/summary/SummaryRatingsProps.ts';
  import { onMount } from 'svelte';

  type Invalidate = ReturnType<typeof useInvalidator>['invalidate'];

  const {
    output,
    ...props
  }: SummaryRatingsProps & { output: (invalidate: Invalidate) => void } =
    $props();

  const { invalidate } = useInvalidator();

  onMount(() => output(invalidate));
</script>

<SummaryRatings {...props} />
