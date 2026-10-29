<script lang="ts" generics="T">
  import SectionHeader from '$lib/components/headers/SectionHeader.svelte';
  import EmptyState from './EmptyState.svelte';
  import SectionError from './SectionError.svelte';
  import type { SectionStateProps } from './SectionStateProps.ts';

  const { header, lead, label, status, emptyText, children }:
    SectionStateProps<T> = $props();

  const titleId = $props.id();
  const isLoading = $derived(status.kind === 'loading');

  let section: HTMLElement | undefined = $state();
</script>

<section
  bind:this={section}
  class="trakt-section-state"
  aria-label={label}
  aria-labelledby={label ? undefined : titleId}
  aria-busy={isLoading}
>
  {#if lead}
    <div class="section-state-header">
      {@render lead()}
      <div class="section-state-title">
        <SectionHeader {...header} {titleId} loading={isLoading} />
      </div>
    </div>
  {:else}
    <SectionHeader {...header} {titleId} loading={isLoading} />
  {/if}
  {#if status.kind === 'empty'}
    <EmptyState>{emptyText}</EmptyState>
  {:else if status.kind === 'error'}
    <SectionError retry={status.retry} fallback={section} describedBy={titleId} />
  {:else if status.kind === 'ready'}
    {@render children?.(status.data)}
  {/if}
</section>

<style lang="scss">
  .trakt-section-state {
    /* It takes focus only as a fallback target, and a ring would outline the whole section. */
    &:focus {
      outline: none;
    }

    .section-state-header {
      display: flex;
    }

    .section-state-title {
      flex: 1;
      min-width: var(--ni-0);
    }
  }
</style>
