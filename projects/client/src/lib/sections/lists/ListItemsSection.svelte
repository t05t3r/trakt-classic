<script lang="ts" generics="T">
  import { page } from '$app/state';
  import EmptyState from '$lib/components/feedback/EmptyState.svelte';
  import SectionError from '$lib/components/feedback/SectionError.svelte';
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
  import { FIRST_PAGE } from '$lib/utils/FIRST_PAGE.ts';
  import { createFocusRetention } from '$lib/utils/focus/createFocusRetention.ts';
  import { firstTabbable } from '$lib/utils/focus/firstTabbable.ts';
  import { tick } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import type {
    ListItemsSectionProps,
    ToolbarControls,
  } from './ListItemsSectionProps.ts';

  const LOADING = { kind: 'loading' } as const;

  const {
    reading,
    heading,
    emptyText,
    grid,
    toolbar,
    cellSelector = '.trakt-poster-grid > li',
  }: ListItemsSectionProps<T> = $props();

  const id = $props.id();
  const titleId = `${id}-title`;
  const panelId = `${id}-panel`;
  const gearId = `${id}-gear`;

  let open = $state(false);
  let root: HTMLElement | undefined = $state();
  let body: HTMLElement | undefined = $state();

  const status = $derived(reading?.status ?? LOADING);
  const pages = $derived({
    current: reading?.pages.current ?? FIRST_PAGE,
    total: reading?.pages.total ?? 1,
  });
  const isLoading = $derived(status.kind === 'loading');
  const isPaged = $derived(pages.total > 1);

  const toggle = async () => {
    open = !open;
    if (!open) return;

    await tick();
    const panel = document.getElementById(panelId);
    if (panel) firstTabbable(panel)?.focus();
  };

  // After a menu pick, the menu hands the focus back to its trigger first, so the gear
  // takes it a flush later; Escape and the direction press share the path.
  const close = async () => {
    if (!open) return;
    open = false;

    await tick();
    document.getElementById(gearId)?.focus();
  };

  // Without a title bar, the toolbar holds the spinner too.
  const controls: ToolbarControls = $derived({
    open,
    panelId,
    gearId,
    toggle,
    close,
    loading: !heading && isLoading,
  });

  // The cells as they stood before the update, so a cell that left keeps its place.
  let cells: ReadonlyArray<HTMLElement> = [];

  const cellOf = (control: HTMLElement) =>
    control.closest<HTMLElement>(cellSelector) ?? control;

  const isConnected = (cell: HTMLElement) => cell.isConnected;

  const neighbourOf = (index: number) =>
    cells.slice(index + 1).find(isConnected) ??
      cells.slice(0, index).filter(isConnected).at(-1);

  // A control that cannot take the focus leaves it to the retention's fallback.
  const focusOn = (control: HTMLElement | undefined, options?: FocusOptions) => {
    if (!control) return false;
    control.focus(options);
    return document.activeElement === control;
  };

  // A card that stays keeps the focus, on its first tabbable control; one that left
  // hands it to the next card, or the previous one at the end.
  const refocusCell = (
    { region, active }: { region: HTMLElement; active: Element | null },
  ) => {
    const index = cells.indexOf(region);
    if (index === -1) return false;
    // Focus moved elsewhere was moved on purpose.
    if (active !== document.body && !region.contains(active)) return false;

    // The page keeps its scroll, since the user may have scrolled on meanwhile.
    if (region.isConnected) {
      return focusOn(firstTabbable(region), { preventScroll: true });
    }

    const neighbour = neighbourOf(index);
    return focusOn(neighbour && firstTabbable(neighbour));
  };

  const retention = createFocusRetention({
    regionOf: cellOf,
    // An open menu holds the focus in its portal for the card.
    keep: (region) => !!openMenuIn(region),
    claim: refocusCell,
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
    cells = body ? [...body.querySelectorAll<HTMLElement>(cellSelector)] : [];
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
  {@render toolbar(controls)}
  {#if heading}
    <ListTitleBar
      title={heading.title}
      href={heading.href}
      {titleId}
      loading={isLoading}
    />
    <ListDescription text={heading.description} />
  {/if}
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
            describedBy={heading ? titleId : undefined}
          />
        </div>
      {:else if status.kind === 'ready'}
        {@render pagination('top', m.label_pagination_navigation_top())}
        <div class="list-items-grid" {@attach trackGrid}>
          {@render grid(status.data)}
        </div>
        {@render pagination('bottom', m.label_pagination_navigation_bottom())}
      {/if}
    </div>
  </ContainerPage>
</div>

<style lang="scss">
  .trakt-list-items-section {
    // A flow root keeps its children's margins on the section's surface.
    display: flow-root;
    background: var(--color-surface);

    // It takes focus only as a retry's fallback, and a ring would outline the whole grid.
    .list-items-body:focus {
      outline: none;
    }

    .list-items-state {
      margin-block: var(--ni-20);
    }

    .list-items-pagination {
      padding-block-end: var(--ni-6);

      &[data-position='top'] {
        margin-block-start: var(--ni-20);
      }

      &[data-position='bottom'] {
        margin-block-end: var(--ni-20);
      }
    }
  }
</style>
