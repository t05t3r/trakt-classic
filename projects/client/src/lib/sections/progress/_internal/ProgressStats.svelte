<script lang="ts">
  import SharePie from '$lib/components/progress/SharePie.svelte';
  import CountStat from '$lib/components/stats/CountStat.svelte';
  import HumanizedMinutes from '$lib/components/stats/HumanizedMinutes.svelte';
  import TooltipDetail from '$lib/components/tooltip/TooltipDetail.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { countText } from '$lib/utils/formatting/number/countText.ts';
  import { toGroupedNumber } from '$lib/utils/formatting/number/toGroupedNumber.ts';
  import IconCalendar from '@tabler/icons-svelte/icons/calendar';
  import IconCheck from '@tabler/icons-svelte/icons/check';
  import IconHistory from '@tabler/icons-svelte/icons/history';
  import type { ProgressStatsProps } from './ProgressStatsProps.ts';
  import TimeLeftStat from './TimeLeftStat.svelte';

  const {
    completed,
    total,
    minutesLeft,
    watched,
    announced = 0,
  }: ProgressStatsProps = $props();

  const remaining = $derived(Math.max(total - completed, 0));
</script>

{#snippet pie(className: string)}
  <SharePie {completed} {total} class={className} />
{/snippet}

{#snippet timeLeftHint()}
  <p>{m.text_progress_time_left()}</p>
  <TooltipDetail text={countText.of({ count: remaining, unit: 'episodes' })} />
{/snippet}

<div class="trakt-progress-stats">
  {#if total > 0}
    <CountStat
      --count-stat-glyph-color="var(--color-action-watch)"
      glyph={pie}
      variant="row"
      value={m.text_progress_season_count({ completed, aired: total })}
      label={m.text_progress_stat_watched()}
      hint={m.tooltip_text_episodes_watched()}
    />
  {/if}
  {#if watched}
    {#snippet timeWatched()}
      <HumanizedMinutes minutes={watched.minutes} />
    {/snippet}
    <CountStat
      --count-stat-glyph-color="var(--color-action-watch)"
      icon={IconCheck}
      variant="row"
      value={toGroupedNumber(watched.plays)}
      label={countText.word({ count: watched.plays, unit: 'plays' })}
      hint={m.stat_text_plays()}
    />
    <CountStat
      icon={IconHistory}
      variant="row"
      value={timeWatched}
      label={m.text_progress_stat_watched()}
      hint={m.tooltip_text_time_watched()}
    />
  {/if}
  <TimeLeftStat {completed} {total} minutes={minutesLeft} hint={timeLeftHint} />
  {#if announced > 0}
    <CountStat
      icon={IconCalendar}
      variant="row"
      value={toGroupedNumber(announced)}
      label={m.text_progress_stat_announced()}
    />
  {/if}
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-progress-stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ni-5) var(--ni-20);

    // Two by two, each stat keeping its word, since a phone shows no tooltip.
    @include for-mobile {
      display: grid;
      grid-template-columns: repeat(2, minmax(var(--ni-0), 1fr));
    }
  }
</style>
