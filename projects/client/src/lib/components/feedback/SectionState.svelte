<script lang="ts" generics="T">
  import SectionHeader from '$lib/components/headers/SectionHeader.svelte';
  import StatusBody from './_internal/StatusBody.svelte';
  import EmptyState from './EmptyState.svelte';
  import type { SectionStateProps } from './SectionStateProps.ts';

  const { header, lead, label, status, emptyText, children: content }:
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
  <StatusBody {status} fallback={section} describedBy={titleId}>
    {#snippet empty()}
      <EmptyState>{emptyText}</EmptyState>
    {/snippet}
    {#snippet children(data)}
      {@render content?.(data)}
    {/snippet}
  </StatusBody>
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
