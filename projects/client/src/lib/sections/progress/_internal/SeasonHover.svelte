<script lang="ts">
  import CaptionTag from '$lib/components/badges/CaptionTag.svelte';
  import EpisodesWatchedBar from '$lib/components/progress/EpisodesWatchedBar.svelte';
  import HumanizedMinutes from '$lib/components/stats/HumanizedMinutes.svelte';
  import MessageWithBold from '$lib/components/text/MessageWithBold.svelte';
  import TooltipBand from '$lib/components/tooltip/TooltipBand.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { toWatchProgress } from '$lib/features/media-actions/toWatchProgress.ts';
  import { toHumanPatternDate } from '$lib/utils/formatting/date/toHumanPatternDate.ts';
  import { toPercentage } from '$lib/utils/formatting/number/toPercentage.ts';
  import { episodeSxeLabel } from '$lib/utils/intl/episodeSxeLabel.ts';
  import { seasonLabel } from '$lib/utils/intl/seasonLabel.ts';
  import { isProgressComplete } from '$lib/utils/media/isProgressComplete.ts';
  import IconCheck from '@tabler/icons-svelte/icons/check';
  import type { SeasonHoverProps } from './SeasonHoverProps.ts';
  import Bracketed from './Bracketed.svelte';
  import OutlineBadge from './OutlineBadge.svelte';
  import TimeLeftStat from './TimeLeftStat.svelte';

  const { season, upNext }: SeasonHoverProps = $props();

  const progress = $derived(toWatchProgress(season));
</script>

<div class="trakt-season-hover">
  <TooltipBand edge="start">
    <div class="season-hover-top">
      <div class="season-hover-head">
        <span class="season-hover-name">{seasonLabel(season.number)}</span>
        <!-- A caught-up season's next episode has not aired yet. -->
        {#if isProgressComplete(season)}
          <OutlineBadge icon={IconCheck} tone="watch">
            {m.tag_text_complete()}
          </OutlineBadge>
        {:else if upNext}
          <CaptionTag>
            {m.tag_text_up_next()}
            {episodeSxeLabel(upNext)}
          </CaptionTag>
        {/if}
      </div>
      <!-- The share below already says it, so a screen reader hears it once. -->
      <div class="season-hover-bar" aria-hidden="true">
        <EpisodesWatchedBar
          completed={season.completed}
          total={season.total}
          size="sm"
        />
      </div>
      <TimeLeftStat
        completed={season.completed}
        total={season.total}
        minutes={season.minutesLeft}
        swap={false}
      />
    </div>
  </TooltipBand>
  <div class="season-hover-bottom">
    {#if progress}
      <p class="season-hover-share">
        <MessageWithBold
          message={m.tooltip_text_watched_percent({
            percent: toPercentage(progress.percent / 100),
          })}
        />
      </p>
      <p>
        {progress.counts}
        {#if season.minutesWatched > 0}
          <i><Bracketed><HumanizedMinutes
                minutes={season.minutesWatched}
                swap={false}
              /></Bracketed></i>
        {/if}
      </p>
      {#if season.lastWatchedAt}
        <p>
          {m.text_progress_last_watched()}
          <b>{toHumanPatternDate(season.lastWatchedAt, 'd MMM yyyy')}</b>
        </p>
      {/if}
    {:else}
      <p class="season-hover-share">
        <b>{m.text_progress_season_count({
            completed: season.completed,
            aired: season.total,
          })}</b>
        {m.text_progress_stat_watched()}
      </p>
    {/if}
  </div>
</div>

<style lang="scss">
  .trakt-season-hover {
    min-width: var(--ni-240);
    color: var(--color-text-muted);

    .season-hover-top {
      display: flex;
      flex-direction: column;
      row-gap: var(--ni-10);
      align-items: center;
    }

    .season-hover-head {
      display: flex;
      column-gap: var(--ni-10);
      justify-content: space-between;
      align-items: center;
      align-self: stretch;
      font-family: var(--font-family-heading);
      font-weight: var(--font-weight-heading);
    }

    .season-hover-bar {
      --color-progress-track: var(--color-tooltip-progress-track);

      align-self: stretch;
    }

    .season-hover-bottom {
      padding-block-start: var(--ni-10);
    }

    .season-hover-share {
      color: var(--color-tooltip-text);
    }
  }
</style>
