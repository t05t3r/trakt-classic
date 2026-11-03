<script lang="ts" generics="T">
  import { page } from '$app/state';
  import EmptyState from '$lib/components/feedback/EmptyState.svelte';
  import SectionError from '$lib/components/feedback/SectionError.svelte';
  import PosterGrid from '$lib/components/media/PosterGrid.svelte';
  import {
    openMenuIn,
    watchMenusIn,
  } from '$lib/components/menus/openMenus.ts';
  import Pagination from '$lib/components/pagination/Pagination.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import ContainerPage from '$lib/sections/layout/ContainerPage.svelte';
  import ListDescription from '$lib/sections/subnav/ListDescription.svelte';
  import ListTitleBar from '$lib/sections/subnav/ListTitleBar.svelte';
  import { GlobalEventBus } from '$lib/utils/events/GlobalEventBus.ts';
  import { createFocusRetention } from '$lib/utils/focus/createFocusRetention.ts';
  import { firstFocusable } from '$lib/utils/focus/firstFocusable.ts';
  import { tick } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import type { ListItemsSectionProps } from './ListItemsSectionProps.ts';

  const {
    status,
    key,
    item,
    pages,
    title,
    href,
    description,
    emptyText,
    toolbar,
  }: ListItemsSectionProps<T> = $props();

  const id = $props.id();
  const titleId = `${id}-title`;
  const panelId = `${id}-panel`;

  let open = $state(false);
  let root: HTMLElement | undefined = $state();
  let gear: HTMLButtonElement | undefined = $state();
  let body: HTMLElement | undefined = $state();

  const isLoading = $derived(status.kind === 'loading');
  const isPaged = $derived(pages.total > 1);

  // The panel comes before the gear in the Tab order, so opening it leads the focus in.
  const toggle = async () => {
    open = !open;
    if (!open) return;

    await tick();
    const panel = document.getElementById(panelId);
    if (panel) firstFocusable(panel)?.focus();
  };

  // After a menu pick, the menu hands the focus back to its trigger first, so the gear
  // takes it a flush later; Escape and the direction press share the path.
  const close = async () => {
    if (!open) return;
    open = false;

    await tick();
    gear?.focus();
  };

  const CELL = '.trakt-poster-grid > li';

  // The cells as they stood before the update, so a cell that left keeps its place.
  let cells: ReadonlyArray<HTMLElement> = [];

  const cellOf = (control: HTMLElement) =>
    control.closest<HTMLElement>(CELL) ?? control;

  const isConnected = (cell: HTMLElement) => cell.isConnected;

  // A card that left hands the focus to the next card, or the previous one at the end.
  const focusNeighbour = (
    { region, active }: { region: HTMLElement; active: Element | null },
  ) => {
    const index = cells.indexOf(region);
    if (index === -1) return false;
    // Focus moved elsewhere was moved on purpose.
    if (active !== document.body && !region.contains(active)) return false;

    const neighbour = cells.slice(index + 1).find(isConnected) ??
      cells.slice(0, index).filter(isConnected).at(-1);
    const control = neighbour && firstFocusable(neighbour);
    if (!control) return false;

    control.focus();
    return true;
  };

  const retention = createFocusRetention({
    regionOf: cellOf,
    // An open menu holds the focus in its portal for the card.
    keep: (region) => !!openMenuIn(region),
    claim: focusNeighbour,
  });

  // A menu may open or close with no focus event in the card.
  const trackGrid: Attachment<HTMLElement> = (grid) => {
    const untrack = retention.track(grid);
    const unwatch = watchMenusIn(grid, (trigger, open) => {
      if (open) retention.remember(trigger);
      else retention.forgetLater();
    });

    return () => {
      untrack();
      unwatch();
    };
  };

  $effect.pre(() => {
    void status;
    cells = body ? [...body.querySelectorAll<HTMLElement>(CELL)] : [];
  });

  $effect(() => {
    void status;
    retention.settle(body);
  });

  // A focused element outside the section, such as the navbar menu, handles its own Escape.
  const isFromOutside = (target: EventTarget | null) =>
    target instanceof Element &&
    target !== document.body &&
    !root?.contains(target);

  // An open menu in the panel takes its own Escape and marks it handled.
  const closeOnEscape: Attachment = () =>
    GlobalEventBus.getInstance().register('keydown', (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (isFromOutside(event.target)) return;

      close();
    });
</script>

{#snippet pagination(position: 'top' | 'bottom', label: string)}
  {#if isPaged}
    <div class="list-items-pagination" data-position={position}>
      <Pagination
        current={pages.current}
        total={pages.total}
        url={page.url}
        {label}
      />
    </div>
  {/if}
{/snippet}

<div
  class="trakt-list-items-section"
  bind:this={root}
  {@attach open && closeOnEscape}
>
  {@render toolbar({ open, panelId, close })}
  <ListTitleBar
    {title}
    {href}
    {titleId}
    loading={isLoading}
    {open}
    {panelId}
    ontoggle={toggle}
    bind:gear
  />
  <ListDescription text={description} />
  <ContainerPage>
    <div class="list-items-body" aria-busy={isLoading} bind:this={body}>
      {#if status.kind === 'empty'}
        <!-- A hide that empties one page leaves the others to reach. -->
        {@render pagination('top', m.label_pagination_navigation_top())}
        <div class="list-items-state">
          <EmptyState>{emptyText}</EmptyState>
        </div>
        {@render pagination('bottom', m.label_pagination_navigation_bottom())}
      {:else if status.kind === 'error'}
        <div class="list-items-state">
          <SectionError
            retry={status.retry}
            fallback={body}
            describedBy={titleId}
          />
        </div>
      {:else if status.kind === 'ready'}
        {@render pagination('top', m.label_pagination_navigation_top())}
        <div class="list-items-grid" {@attach trackGrid}>
          <PosterGrid items={status.data} {key} {item} />
        </div>
        {@render pagination('bottom', m.label_pagination_navigation_bottom())}
      {/if}
    </div>
  </ContainerPage>
</div>

<style lang="scss">
  .trakt-list-items-section {
    // It takes focus only as a retry's fallback, and a ring would outline the whole grid.
    .list-items-body:focus {
      outline: none;
    }

    .list-items-state {
      margin-block: var(--ni-20);
    }

    .list-items-pagination {
      &[data-position='top'] {
        margin-block-start: var(--ni-20);
      }

      &[data-position='bottom'] {
        margin-block-end: var(--ni-20);
      }
    }
  }
</style>
