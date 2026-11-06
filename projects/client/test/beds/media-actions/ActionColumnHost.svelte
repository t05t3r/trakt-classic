<script lang="ts">
  import ActionColumn from '$lib/features/media-actions/components/ActionColumn.svelte';
  import { useInvalidator } from '$lib/features/query/useInvalidator.ts';
  import { onMount, type ComponentProps } from 'svelte';

  type Invalidate = ReturnType<typeof useInvalidator>['invalidate'];

  const {
    output,
    ...props
  }: ComponentProps<typeof ActionColumn> & {
    output: (invalidate: Invalidate) => void;
  } = $props();

  const { invalidate } = useInvalidator();

  onMount(() => output(invalidate));
</script>

<ActionColumn {...props} />
