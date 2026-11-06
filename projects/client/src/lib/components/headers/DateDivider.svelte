<script lang="ts">
  import HumanizedMinutes from '$lib/components/stats/HumanizedMinutes.svelte';
  import { toHumanPatternDate } from '$lib/utils/formatting/date/toHumanPatternDate.ts';
  import IconClock from '@tabler/icons-svelte/icons/clock';
  import type { DateDividerProps } from './DateDividerProps.ts';

  const {
    date,
    minutes,
    expanded,
    controls,
    onToggle,
  }: DateDividerProps = $props();
</script>

<h2 class="trakt-date-divider">
  <button
    type="button"
    class="date-divider-toggle"
    aria-expanded={expanded}
    aria-controls={controls}
    onclick={(event) => {
      // Not every browser focuses a clicked button, and the toggle may remove what holds the focus.
      event.currentTarget.focus({ preventScroll: true });
      onToggle();
    }}
  >
    <IconClock class="date-divider-glyph" aria-hidden="true" /><b
      class="date-divider-weekday"
    >{toHumanPatternDate(date, 'EEEE')}</b>
    {toHumanPatternDate(date, 'd MMMM yyyy')}
    {#if minutes !== undefined}
      <span class="time-spent">
        <HumanizedMinutes {minutes} swap={false} />
      </span>
    {/if}
  </button>
</h2>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-date-divider {
    margin-block-start: var(--ni-20);
    line-height: var(--line-height-heading);

    .date-divider-toggle {
      position: relative;
      display: block;
      width: 100%;
      margin: var(--ni-0);
      padding: var(--ni-0);
      padding-block-end: var(--ni-2);
      border: none;
      border-block-end: var(--border-thickness-xxs) solid var(--divider-rule);
      background: none;
      color: var(--color-text-primary);
      text-align: start;
      cursor: row-resize;

      // The whole block takes the click: the blank above the rule and both gutters.
      &::before {
        content: '';
        position: absolute;
        inset-block: var(--ni-neg-20) var(--ni-neg-1);
        inset-inline: var(--gutter-half-negative);
      }

      // The browser's auto ring bulges around the text, taller than this tight line.
      &:focus-visible {
        outline-width: var(--border-thickness-xs);
        outline-style: solid;
        outline-offset: var(--ni-2);
      }
    }

    :global(.date-divider-glyph) {
      @include heading-glyph(var(--icon-size-heading));
    }

    .date-divider-weekday {
      font-weight: var(--font-weight-heading);
    }

    .time-spent {
      float: inline-end;
      padding-block-start: var(--time-spent-padding-block-start);
      color: var(--color-text-muted);
      font-size: var(--font-size-heading-muted);
    }
  }
</style>
