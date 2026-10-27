<script lang="ts">
  import { toRovingIndex } from '$lib/utils/events/toRovingIndex.ts';
  import type { PillTabsProps } from './_internal/PillTabsProps.ts';

  const { label, tabs, value, onValueChange, children }: PillTabsProps =
    $props();

  const id = $props.id();
  const panelId = `${id}-panel`;
  const tabId = (index: number) => `${id}-tab-${index}`;
  // An unknown value still shows a tab, so the panel keeps a pane and a name.
  const shownIndex = $derived(
    Math.max(tabs.findIndex((tab) => tab.value === value), 0),
  );
  const shown = $derived(tabs.at(shownIndex));

  const onKeydown = (
    event: KeyboardEvent & { currentTarget: HTMLButtonElement },
    from: number,
  ) => {
    // A modified key belongs to the browser: Alt+ArrowLeft is Back.
    if (event.altKey || event.metaKey || event.ctrlKey) return;

    const isRtl = event.currentTarget.matches(':dir(rtl)');
    const target = toRovingIndex({
      key: event.key,
      from,
      count: tabs.length,
      isRtl,
    });
    if (target === undefined) return;

    const tab = tabs.at(target);
    if (!tab) return;

    event.preventDefault();
    // value lags a burst, so a target equal to it still passes on.
    onValueChange(tab.value);
    document.getElementById(tabId(target))?.focus();
  };
</script>

<div class="trakt-pill-tabs">
  <div class="pill-tab-list" role="tablist" aria-label={label}>
    {#each tabs as tab, index (tab.value)}
      <button
        type="button"
        class="pill-tab"
        class:is-active={index === shownIndex}
        role="tab"
        id={tabId(index)}
        aria-selected={index === shownIndex}
        aria-controls={panelId}
        tabindex={index === shownIndex ? 0 : -1}
        onclick={() => onValueChange(tab.value)}
        onkeydown={(event) => onKeydown(event, index)}
      >
        {tab.text}
        {#if tab.count !== undefined}
          <span class="pill-tab-count">{tab.count}</span>
        {/if}
      </button>
    {/each}
  </div>

  <div
    role="tabpanel"
    id={panelId}
    aria-labelledby={shown ? tabId(shownIndex) : undefined}
  >
    {#if shown}
      {@render children(shown.value)}
    {/if}
  </div>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-pill-tabs {
    .pill-tab-list {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      margin-block-start: var(--ni-neg-2);
    }

    .pill-tab {
      margin-block-start: var(--ni-5);
      margin-inline-end: var(--ni-7);
      padding-block: var(--ni-3) var(--ni-2);
      padding-inline: var(--ni-6);
      border: none;
      border-radius: var(--border-radius-xs);
      background: var(--color-pill-background);
      color: var(--color-text-tertiary);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-small);
      font-weight: var(--font-weight-heading-light);
      line-height: var(--line-height-tag);
      cursor: pointer;
      transition:
        background var(--transition-default),
        color var(--transition-default);
    }

    .pill-tab-count {
      display: inline-block;
      margin-block: var(--ni-neg-1);
      margin-inline: var(--ni-3) var(--ni-neg-4);
      padding-block: var(--ni-1);
      padding-inline: var(--ni-4);
      border: var(--border-thickness-xxs) solid
        var(--color-pill-count-background);
      border-radius: var(--border-radius-xs);
      background: var(--color-pill-count-background);
      color: var(--color-pill-count-text);
      font-size: var(--font-size-micro);
      font-weight: var(--font-weight-heading-heavy);
      vertical-align: top;
      transition:
        background var(--transition-default),
        border-color var(--transition-default),
        color var(--transition-default);
    }

    .pill-tab.is-active {
      background: var(--color-accent);
      color: var(--color-text-primary);

      .pill-tab-count {
        border-color: var(--color-pill-count-background-active);
        background: var(--color-pill-count-background-active);
        color: var(--color-pill-count-text-active);
      }
    }

    // After the active rules, so a hovered active tab takes the hover count.
    @include for-mouse {
      .pill-tab:hover {
        background: var(--color-pill-background-hover);
        color: var(--color-text-primary);

        .pill-tab-count {
          border-color: var(--color-pill-count-background-hover);
          background: var(--color-pill-count-background-hover);
          color: var(--color-pill-count-text);
        }
      }

      .pill-tab.is-active:hover {
        background: var(--color-accent-hover);
      }
    }
  }
</style>
