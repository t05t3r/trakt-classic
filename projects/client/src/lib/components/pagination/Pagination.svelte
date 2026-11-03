<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import type { Icon } from '@tabler/icons-svelte';
  import IconArrowLeft from '@tabler/icons-svelte/icons/arrow-left';
  import IconArrowRight from '@tabler/icons-svelte/icons/arrow-right';
  import IconDots from '@tabler/icons-svelte/icons/dots';
  import { paginationWindow } from './_internal/paginationWindow.ts';
  import { toPageHref } from './_internal/toPageHref.ts';
  import type { PaginationProps } from './PaginationProps.ts';

  type PaginationEnd = 'previous' | 'next';

  const ENDS: Readonly<
    Record<PaginationEnd, Readonly<{ label: () => string; icon: Icon }>>
  > = {
    previous: { label: m.button_label_previous_page, icon: IconArrowLeft },
    next: { label: m.button_label_next_page, icon: IconArrowRight },
  };

  const {
    current,
    total,
    url,
    label = m.label_pagination_navigation(),
  }: PaginationProps = $props();

  const shown = $derived(paginationWindow({ current, count: total }));
  const previous = $derived(shown.current > 1 ? shown.current - 1 : null);
  const next = $derived(shown.current < total ? shown.current + 1 : null);

  const hrefTo = (target: number) => toPageHref({ url, page: target });
</script>

{#snippet end(direction: PaginationEnd, target: number | null)}
  {@const { label, icon: Arrow } = ENDS[direction]}
  {#if target === null}
    <!-- Not an anchor, which the router would preload; announced disabled, it takes no focus and goes nowhere. -->
    <span
      class="pagination-entry"
      role="link"
      aria-disabled="true"
      aria-label={label()}
    >
      <Arrow class="pagination-icon trakt-icon-directional" aria-hidden="true" />
    </span>
  {:else}
    <a class="pagination-entry" href={hrefTo(target)} aria-label={label()}>
      <Arrow class="pagination-icon trakt-icon-directional" aria-hidden="true" />
    </a>
  {/if}
{/snippet}

{#if total > 1}
  <nav class="trakt-pagination" aria-label={label}>
    <ul class="pagination-list" role="list">
      <li class="pagination-item">{@render end('previous', previous)}</li>
      {#each shown.slots as slot (slot.key)}
        {#if slot.kind === 'page'}
          <li class="pagination-item">
            <a
              class="pagination-entry"
              href={hrefTo(slot.page)}
              aria-current={slot.page === shown.current ? 'page' : undefined}
            >
              {slot.page}
            </a>
          </li>
        {:else}
          <li class="pagination-item" aria-hidden="true">
            <span class="pagination-entry">
              <IconDots class="pagination-icon" />
            </span>
          </li>
        {/if}
      {/each}
      <li class="pagination-item">{@render end('next', next)}</li>
    </ul>
  </nav>
{/if}

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-pagination {
    .pagination-list {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .pagination-item {
      display: flex;
    }

    // Every entry takes the row's height, so an arrow centres on the digits.
    .pagination-entry {
      display: flex;
      align-items: center;
      padding: var(--ni-6) var(--ni-12);
      color: var(--color-text-primary);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-pagination);
      font-weight: var(--font-weight-heading-light);
      line-height: var(--line-height-text);
      text-decoration: none;
    }

    .pagination-entry[aria-current='page'] {
      background: var(--color-accent);
      font-weight: var(--font-weight-heading-heavy);
    }

    .pagination-entry[aria-disabled='true'] {
      cursor: not-allowed;
    }

    @include for-mouse {
      .pagination-entry[href]:hover {
        color: var(--color-link);
      }

      .pagination-entry[aria-current='page']:hover {
        background: var(--color-accent-hover);
        color: var(--color-text-primary);
      }
    }

    :global(.pagination-icon) {
      display: block;
      width: var(--icon-size-pagination);
      height: var(--icon-size-pagination);
      stroke-width: var(--icon-stroke-chrome);
    }
  }
</style>
