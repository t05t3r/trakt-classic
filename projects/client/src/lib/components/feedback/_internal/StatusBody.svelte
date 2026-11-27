<script lang="ts" generics="T">
  import SectionError from '../SectionError.svelte';
  import type { StatusBodyProps } from './StatusBodyProps.ts';

  const { status, empty, children, describedBy, fallback, pending }:
    StatusBodyProps<T> = $props();
</script>

{#if status.kind === 'loading'}
  {@render pending?.()}
{:else if status.kind === 'error'}
  <SectionError retry={status.retry} {fallback} {describedBy} />
{:else if status.kind === 'empty'}
  {@render empty()}
{:else}
  {@render children(status.data)}
{/if}
