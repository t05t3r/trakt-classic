<script lang="ts" module>
  // Module-level, so opening one menu closes whichever menu was open before.
  let closeOpenMenu: (() => void) | undefined;

  type NextRowIndexParams = { key: string; index: number; count: number };

  function nextRowIndex(
    { key, index, count }: NextRowIndexParams,
  ): number | undefined {
    if (count === 0) return undefined;

    switch (key) {
      case 'ArrowDown':
        return (index + 1) % count;
      case 'ArrowUp':
        return index <= 0 ? count - 1 : index - 1;
      case 'Home':
        return 0;
      case 'End':
        return count - 1;
      default:
        return undefined;
    }
  }
</script>

<script lang="ts" generics="K extends string">
  import { afterNavigate } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { selectedNavItem } from '$lib/features/navigation/selectedNavItem.ts';
  import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
  import { useMedia } from '$lib/stores/css/useMedia.ts';
  import {
    clickOutside,
    type ClickOutsideEventDetail,
  } from '$lib/utils/actions/clickOutside.ts';
  import { onDestroy } from 'svelte';
  import { fromAction } from 'svelte/attachments';
  import type { NavMenuProps, NavMenuRow } from './NavMenuProps.ts';

  const { label, trigger, items, action }: NavMenuProps<K> = $props();

  const row: NavMenuRow = {
    role: 'menuitem',
    class: 'nav-menu-row',
    tabindex: -1,
  };

  const outside = fromAction(clickOutside);
  const isMouse = useMedia(WELL_KNOWN_MEDIA_QUERY.mouse);

  let isOpen = $state(false);
  let isHoverSuppressed = $state(false);
  let root: HTMLDivElement | undefined = $state();
  let triggerButton: HTMLButtonElement | undefined = $state();
  let panel: HTMLDivElement | undefined = $state();

  const selected = $derived(
    selectedNavItem({
      pathname: page.url.pathname,
      hasError: Boolean(page.error),
      items,
    }),
  );

  const release = () => {
    if (closeOpenMenu === close) closeOpenMenu = undefined;
  };

  const close = () => {
    isOpen = false;
    release();
  };

  const open = () => {
    if (closeOpenMenu !== close) closeOpenMenu?.();
    closeOpenMenu = close;
    isOpen = true;
  };

  const isMouseClick = (event: MouseEvent) => {
    if (event instanceof PointerEvent && event.pointerType) {
      return event.pointerType === 'mouse';
    }

    return event.detail > 0;
  };

  const onTriggerClick = (event: MouseEvent) => {
    // Hover already shows the menu to a mouse, so only a tap or a key toggles it.
    if ($isMouse && isMouseClick(event)) return;

    if (isOpen) return close();

    open();
  };

  // The pointer still rests on the row it clicked, so hover would keep the panel shown.
  afterNavigate(() => {
    close();
    isHoverSuppressed = root?.matches(':hover') ?? false;
  });
  onDestroy(release);

  const restoreHover = () => {
    isHoverSuppressed = false;
  };

  const onFocusOut = (
    { currentTarget, relatedTarget }: FocusEvent & {
      currentTarget: HTMLElement;
    },
  ) => {
    if (relatedTarget instanceof Node && currentTarget.contains(relatedTarget)) {
      return;
    }

    close();
  };

  const onPanelKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') return close();

    onKeydown(event);
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (!isOpen) return;

    const rows = Array.from(
      panel?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    const next = nextRowIndex({
      key: event.key,
      index: rows.findIndex((row) => row === document.activeElement),
      count: rows.length,
    });
    if (next === undefined) return;

    event.preventDefault();
    rows.at(next)?.focus();
  };

  const onOutside = ({ detail }: CustomEvent<ClickOutsideEventDetail>) => {
    if (detail.source === 'scroll' || detail.source === 'resize') return;

    const hadFocus = root?.contains(document.activeElement) ?? false;
    close();
    if (detail.source instanceof KeyboardEvent && hadFocus) {
      triggerButton?.focus();
    }
  };
</script>

<div
  bind:this={root}
  class="trakt-nav-menu"
  class:is-hover-suppressed={isHoverSuppressed}
  {@attach isOpen && outside}
  onclickoutside={onOutside}
  onfocusout={onFocusOut}
>
  <button
    bind:this={triggerButton}
    class="nav-menu-trigger"
    type="button"
    aria-haspopup="menu"
    aria-expanded={isOpen}
    aria-label={label}
    onclick={onTriggerClick}
    onkeydown={onKeydown}
    onmouseleave={restoreHover}
  >
    {@render trigger(isOpen)}
  </button>

  <div
    bind:this={panel}
    class="nav-menu-panel"
    role="menu"
    aria-label={label}
    tabindex="-1"
    hidden={!isOpen}
    onkeydown={onPanelKeydown}
    onmouseleave={restoreHover}
  >
    {#each items as item (item.key)}
      <a
        {...row}
        href={resolve(item.route)}
        aria-current={item.key === selected ? 'page' : undefined}
      >
        {item.label()}
      </a>
    {/each}

    {#if action}
      <div class="nav-menu-divider" role="separator"></div>
      {@render action(row)}
    {/if}
  </div>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-nav-menu {
    position: relative;

    .nav-menu-trigger {
      display: grid;
      padding: var(--ni-0);
      border: none;
      background: none;
      color: inherit;
      cursor: pointer;
    }

    .nav-menu-panel {
      position: absolute;
      inset-block-start: 100%;
      inset-inline-end: var(--ni-0);
      display: grid;
      width: 100%;
      min-width: var(--menu-min-width);
      max-height: calc(100vh - var(--header-height));
      padding-block: var(--menu-padding-block);
      box-sizing: border-box;
      overflow-y: auto;
      border-block-start: var(--ni-1) solid var(--color-accent);
      border-end-start-radius: var(--border-radius-l);
      border-end-end-radius: var(--border-radius-l);
      background: var(--color-surface-menu);
      box-shadow: var(--shadow-dropdown);
      font-family: var(--font-family-heading);
      font-weight: var(--font-weight-heading);

      @include for-desktop-lg-and-below {
        border-start-start-radius: var(--border-radius-l);
      }

      // The display above outranks the user agent's rule for the hidden attribute.
      &[hidden] {
        display: none;
      }
    }

    @include for-mouse {
      &:hover:not(.is-hover-suppressed) .nav-menu-panel[hidden] {
        display: grid;
      }
    }

    .nav-menu-divider {
      margin-block: var(--ni-9);
      border-block-start: var(--ni-1) solid var(--divider-rule);
    }

    .nav-menu-panel :global(.nav-menu-row) {
      display: flex;
      align-items: center;
      min-height: var(--menu-row-height);
      padding-block: var(--ni-0);
      padding-inline: var(--ni-16);
      box-sizing: border-box;
      border: none;
      background: none;
      color: var(--color-text-primary);
      font-size: var(--font-size-text);
      text-align: start;
      text-decoration: none;
      cursor: pointer;

      &[aria-current='page'] {
        color: var(--color-link);
      }

      &:hover,
      &:focus-visible {
        background: var(--color-accent);
        color: var(--color-text-primary);
      }
    }
  }
</style>
