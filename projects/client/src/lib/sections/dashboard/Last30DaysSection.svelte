<script lang="ts">
  import SectionState from '$lib/components/feedback/SectionState.svelte';
  import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
  import DailyMinutesChart from '$lib/components/stats/DailyMinutesChart.svelte';
  import GenreBars from '$lib/components/stats/GenreBars.svelte';
  import HumanizedMinutes from '$lib/components/stats/HumanizedMinutes.svelte';
  import type {
    Last30Days,
    PlayCount,
  } from '$lib/features/dashboard/models/Last30Days.ts';
  import { useLast30Days } from '$lib/features/dashboard/stores/useLast30Days.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import {
    type CountUnit,
    countText,
  } from '$lib/utils/formatting/number/countText.ts';
  import IconChartBar from '@tabler/icons-svelte/icons/chart-bar';
  import { toLast30DaysCharts } from './_internal/toLast30DaysCharts.ts';

  const LOADING: SectionStatus<never> = { kind: 'loading' };

  const last30Days = useLast30Days();

  const status: SectionStatus<Last30Days> = $derived($last30Days ?? LOADING);
  const totals = $derived(
    status.kind === 'ready' ? status.data.totals : undefined,
  );
</script>

{#snippet separator()}
  <span class="help-dash">{m.text_stats_totals_separator()}</span><br class="help-break" />
{/snippet}

{#snippet total(count: PlayCount, unit: CountUnit)}
  {@const parts = countText.withPlays({ count, unit, form: 'spelled' })}
  <span class="help-total">
    <b class="help-figure">{parts.figure}</b>
    {#if parts.plays}
      {parts.word} <span class="help-plays">{parts.plays.text}</span>
    {:else}
      {parts.word}
    {/if}
  </span>
{/snippet}

<!-- No whitespace around a separator: Classic spaces its dash by margin alone. -->
{#snippet totalsHelp()}
  {#if totals}
    <b class="help-figure"><HumanizedMinutes minutes={totals.minutes} /></b>
    {m.text_dashboard_stats_watched()}{@render separator()}{@render total(
      totals.episodes,
      'episodes',
    )}{@render separator()}{@render total(totals.movies, 'movies')}
  {/if}
{/snippet}

<div class="trakt-last-30-days-section">
  <SectionState
    header={{
      title: m.text_dashboard_title_last_30_days(),
      icon: IconChartBar,
      helpText: totals ? totalsHelp : undefined,
    }}
    {status}
    emptyText={m.text_dashboard_empty_last_30_days()}
  >
    {#snippet children(data)}
      {@const charts = toLast30DaysCharts({ data })}
      <div class="chart-row minutes-row">
        <DailyMinutesChart days={charts.days} />
      </div>
      <div class="chart-row">
        <GenreBars genres={charts.genres} />
      </div>
    {/snippet}
  </SectionState>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-last-30-days-section {
    .help-figure {
      font-weight: var(--font-weight-heading);
    }

    .help-dash {
      margin-inline: var(--ni-6);
      color: var(--color-text-help);
    }

    .help-plays {
      color: var(--color-text-plays);
    }

    .help-break {
      display: none;
    }

    .chart-row {
      padding-block-end: var(--ni-20);
    }

    // Classic's chart column: the row's gutter, 2px at the start, and 10px at the end less the canvas's 2px overhang.
    .minutes-row {
      margin-inline: var(--gutter-half-negative);
      padding-inline: var(--ni-2) var(--ni-8);
    }

    @include for-mobile {
      overflow: hidden;

      // The section clips its overflow here, so the chart keeps to its box.
      .minutes-row {
        margin-inline: var(--ni-0);
        padding-inline: var(--ni-0);
      }

      .help-dash {
        display: none;
      }

      .help-break {
        display: inline;
      }
    }
  }
</style>
