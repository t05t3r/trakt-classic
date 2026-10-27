<script lang="ts">
  import { resolve } from '$app/paths';
  import * as m from '$lib/features/i18n/messages.ts';
  import HumanizedMinutes from './HumanizedMinutes.svelte';
  import { toHumanMinutes } from '$lib/utils/formatting/date/toHumanMinutes.ts';
  import { toHumanPatternDate } from '$lib/utils/formatting/date/toHumanPatternDate.ts';
  import {
    type Count,
    type CountUnit,
    countText,
  } from '$lib/utils/formatting/number/countText.ts';
  import type { Attachment } from 'svelte/attachments';
  import type {
    ChartDay,
    DailyMinutesChartProps,
  } from './DailyMinutesChartProps.ts';

  type CountLine = { unit: CountUnit; text: string };

  const { days }: DailyMinutesChartProps = $props();

  const SCALE_STEP = 10;
  const PERCENT = 100;

  const top = $derived(
    Math.ceil(Math.max(0, ...days.map(({ minutes }) => minutes)) / SCALE_STEP) *
      SCALE_STEP,
  );

  // A phone fits only every other day label, counted back from today.
  const isAlternate = (index: number) => (days.length - 1 - index) % 2 === 1;

  function dateLine(date: Date): string {
    return [
      toHumanPatternDate(date, 'EEEE'),
      toHumanPatternDate(date, 'MMMM d'),
    ].join(m.text_stats_date_line_separator());
  }

  function countLine(count: Count, unit: CountUnit): CountLine | undefined {
    if (count.plays === 0) return undefined;

    return {
      unit,
      text: countText.withPlays({ count, unit, form: 'spelled' }).text,
    };
  }

  function countLines(day: ChartDay): ReadonlyArray<CountLine> {
    return [
      countLine(day.episodes, 'episodes'),
      countLine(day.movies, 'movies'),
    ].filter((line) => line !== undefined);
  }

  function dayLabel(day: ChartDay): string {
    return [
      toHumanMinutes(day.minutes),
      dateLine(day.date),
      ...countLines(day).map(({ text }) => text),
    ].join(m.text_stats_day_label_separator());
  }

  const heightOf = (minutes: number) =>
    top === 0 ? 0 : (minutes / top) * PERCENT;

  // Days are held by key, so a day keeps its state when the window moves.
  let hoveredKey = $state<string | undefined>(undefined);
  let focusedKey = $state<string | undefined>(undefined);
  // The last day shown stays rendered while the tooltip fades out.
  let lastKey = $state<string | undefined>(undefined);

  const indexOf = (key: string | undefined) =>
    days.findIndex((day) => day.key === key);

  const shownIndex = $derived(indexOf(hoveredKey ?? focusedKey ?? lastKey));
  const shown = $derived(shownIndex === -1 ? undefined : days.at(shownIndex));
  const isVisible = $derived(indexOf(hoveredKey ?? focusedKey) !== -1);

  function remember() {
    lastKey = hoveredKey ?? focusedKey ?? lastKey;
  }

  function hover(event: PointerEvent, key: string) {
    if (event.pointerType === 'touch') return;

    hoveredKey = key;
    remember();
  }

  function unhover() {
    hoveredKey = undefined;
    remember();
  }

  // The plot, not each bar, ends a hover, so moving across the bars never hides the tooltip.
  const unhoverOnLeave: Attachment<HTMLElement> = (plot) => {
    plot.addEventListener('pointerleave', unhover);

    return () => plot.removeEventListener('pointerleave', unhover);
  };

  function focus(link: HTMLAnchorElement, key: string) {
    // A click focuses its link too; only keyboard focus shows the day.
    if (!link.matches(':focus-visible')) return;

    focusedKey = key;
    remember();
  }

  function blur() {
    focusedKey = undefined;
    remember();
  }
</script>

<div class="trakt-daily-minutes-chart" style:--chart-days={days.length}>
  <div class="chart-plot" {@attach unhoverOnLeave}>
    {#each days as day (day.key)}
      <a
        class="chart-column"
        href={resolve(day.href)}
        aria-label={dayLabel(day)}
        onpointerenter={(event) => hover(event, day.key)}
        onfocus={(event) => focus(event.currentTarget, day.key)}
        onblur={blur}
      >
        <span
          class="chart-bar"
          class:is-active={isVisible && shown?.key === day.key}
          style:--bar-height="{heightOf(day.minutes)}%"
        ></span>
      </a>
    {/each}

    {#if shown !== undefined}
      {@const lines = countLines(shown)}
      <div
        class="chart-tooltip-anchor"
        style:--tooltip-x="{((shownIndex + 0.5) * PERCENT) / days.length}cqw"
        style:--tooltip-y="{-heightOf(shown.minutes)}%"
      >
        <!-- Each bar's link name carries the tooltip's text. -->
        <div
          class="chart-tooltip"
          class:is-visible={isVisible}
          aria-hidden="true"
        >
          <div>
            <HumanizedMinutes minutes={shown.minutes} swap={false} />
          </div>
          <div class="tooltip-detail">
            <span>{dateLine(shown.date)}</span>
          </div>
          {#if lines.length > 0}
            <div class="tooltip-detail">
              {#each lines as line (line.unit)}
                <div>{line.text}</div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Each bar's link name carries its date already. -->
  <div class="chart-labels" aria-hidden="true">
    {#each days as day, index (day.key)}
      <span class="chart-label" class:is-alternate={isAlternate(index)}>
        {toHumanPatternDate(day.date, 'd')}
      </span>
    {/each}
  </div>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-daily-minutes-chart {
    display: flex;
    flex-direction: column;
    height: var(--daily-minutes-chart-height);

    .chart-plot,
    .chart-labels {
      display: grid;
      grid-template-columns: repeat(var(--chart-days), minmax(0, 1fr));
      // Time runs left to right whatever the direction, as Classic's axis did.
      direction: ltr;
    }

    .chart-plot {
      position: relative;
      flex: 1;
      min-height: var(--ni-0);
      container-type: inline-size;
      border-block-end: var(--border-thickness-xxs) solid var(--color-border);
      border-inline-start: var(--border-thickness-xxs) solid
        var(--color-border);
    }

    .chart-column {
      display: flex;
      flex-direction: column;
      justify-content: end;
    }

    .chart-bar {
      height: var(--bar-height);
      margin-inline: var(--ni-1);
      background: var(--color-chart-bar);

      &.is-active {
        background: var(--color-chart-bar-hover);
      }
    }

    // A label wider than its cell overflows both sides evenly.
    .chart-label {
      display: flex;
      justify-content: center;
      color: var(--color-chart-label);
      font-size: var(--font-size-label);

      // Hidden, not removed, so each label left keeps its bar's cell.
      @include for-mobile {
        &.is-alternate {
          visibility: hidden;
        }
      }
    }

    // A zero-width line the plot's height, moved over the shown bar, so the tooltip glides.
    .chart-tooltip-anchor {
      position: absolute;
      inset-block: var(--ni-0);
      inset-inline-start: var(--ni-0);
      width: var(--ni-0);
      pointer-events: none;
      transform: translate(var(--tooltip-x), var(--tooltip-y));
      transition: transform var(--transition-default);
    }

    .chart-tooltip {
      position: absolute;
      inset-inline-start: var(--ni-0);
      inset-block-end: var(--ni-10);
      // Centred over its bar, but held inside the plot at either end.
      transform: translateX(
        clamp(
          calc(var(--tooltip-x) * -1),
          -50%,
          calc(100cqw - var(--tooltip-x) - 100%)
        )
      );
      padding: var(--ni-5) var(--ni-8);
      border: var(--border-thickness-xxs) solid var(--color-border-strong);
      border-radius: var(--border-radius-m);
      background: var(--color-chart-tooltip-background);
      color: var(--color-text-primary);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-text);
      font-weight: var(--font-weight-heading);
      text-align: center;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition:
        opacity var(--transition-default),
        transform var(--transition-default);

      &.is-visible {
        opacity: 1;
      }
    }

    .tooltip-detail {
      color: var(--color-text-help);
      font-size: var(--font-size-label);
    }
  }
</style>
