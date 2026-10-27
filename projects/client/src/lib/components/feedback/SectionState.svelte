<script lang="ts" generics="T">
  import SectionHeader from '$lib/components/headers/SectionHeader.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { createFocusRetention } from '$lib/utils/focus/createFocusRetention.ts';
  import type { Attachment } from 'svelte/attachments';
  import EmptyState from './EmptyState.svelte';
  import type { SectionStateProps } from './SectionStateProps.ts';

  const { header, lead, label, status, emptyText, children }:
    SectionStateProps<T> = $props();

  const titleId = $props.id();
  const isLoading = $derived(status.kind === 'loading');

  let section: HTMLElement | undefined = $state();
  const retention = createFocusRetention();

  // Remembered on the press, since a Safari click leaves the focus on the body.
  const retryInPlace = (button: HTMLButtonElement, retry: () => void) => {
    retention.remember(button);
    retry();
  };

  // A pressed retry may unmount its own button, so the section holds the focus it drops.
  const holdFocusOnLeave: Attachment<HTMLButtonElement> = () => () =>
    retention.settle(section);
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
    <EmptyState>
      {m.error_text_section_load()}
      <button
        type="button"
        class="section-state-retry"
        aria-describedby={titleId}
        onclick={({ currentTarget }) => retryInPlace(currentTarget, status.retry)}
        {@attach holdFocusOnLeave}
      >
        {m.button_text_retry()}
      </button>
    </EmptyState>
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

    .section-state-retry {
      padding: var(--ni-0);
      border: none;
      background: none;
      color: var(--color-link);
      text-decoration: underline;
      cursor: pointer;
    }
  }
</style>
