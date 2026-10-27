<script lang="ts">
  import { resolve } from '$app/paths';
  import ContainerPage from '$lib/sections/layout/ContainerPage.svelte';
  import { scrollActiveItemIntoView } from '$lib/utils/actions/scrollActiveItemIntoView.ts';
  import type { SeasonSwitcherProps } from './SeasonSwitcherProps.ts';

  const { label, entries }: SeasonSwitcherProps = $props();

  const labelId = $props.id();
</script>

<nav class="trakt-season-switcher" aria-labelledby={labelId}>
  <ContainerPage>
    <div data-layout="grid">
      <div class="switcher-column" data-grid-column>
        <span id={labelId} class="switcher-label">{label}</span>
        <ul class="switcher-entries" role="list">
          {#each entries as entry (entry.href)}
            <li
              class="switcher-entry"
              use:scrollActiveItemIntoView={entry.isCurrent}
            >
              <a
                class="switcher-link"
                class:is-current={entry.isCurrent}
                href={resolve(entry.href)}
                aria-current={entry.isCurrent ? 'page' : undefined}
              >
                {entry.label}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </ContainerPage>
</nav>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-season-switcher {
    background: var(--color-surface-recessed);
    font-size: var(--font-size-switcher);
    line-height: var(--line-height-switcher);
    white-space: nowrap;

    // The strip lines up with the info column below it.
    .switcher-column {
      display: flex;
      min-width: 0;

      @include for-mobile {
        display: block;
      }

      @include summary-info-column;
    }

    .switcher-label {
      flex: none;
      margin-inline-end: var(--ni-10);
      color: var(--color-text-tertiary);
      font-family: var(--font-family-heading);
      text-transform: uppercase;

      @include for-mobile {
        display: block;
      }
    }

    // Held at a line's height, so the strip keeps its height while the entries load.
    // Positioned, so an entry's offset that brings it into view is measured from the strip.
    .switcher-entries {
      position: relative;
      display: flex;
      flex: 1;
      min-width: 0;
      min-height: var(--line-height-switcher);
      margin: var(--ni-0);
      padding: var(--ni-0);
      list-style: none;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .switcher-entry {
      flex: none;
      padding-inline-end: var(--ni-10);

      &:last-child {
        padding-inline-end: var(--ni-0);
      }
    }

    .switcher-link {
      color: var(--color-text-help);
      text-decoration: none;
      transition: color var(--transition-default);

      @include for-mouse {
        &:hover {
          color: var(--color-accent);
        }
      }

      &.is-current {
        color: var(--color-text-primary);
        font-family: var(--font-family-heading);
        font-weight: var(--font-weight-heading-heavy);
      }
    }
  }
</style>
