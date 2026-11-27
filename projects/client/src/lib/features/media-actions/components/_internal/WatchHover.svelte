<script lang="ts">
  import TickProgressBar from '$lib/components/progress/TickProgressBar.svelte';
  import MessageWithBold from '$lib/components/text/MessageWithBold.svelte';
  import TooltipBand from '$lib/components/tooltip/TooltipBand.svelte';
  import TooltipDetail from '$lib/components/tooltip/TooltipDetail.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { toHumanMinutes } from '$lib/utils/formatting/date/toHumanMinutes.ts';
  import { toHumanPatternDate } from '$lib/utils/formatting/date/toHumanPatternDate.ts';
  import { countText } from '$lib/utils/formatting/number/countText.ts';
  import { toPercentage } from '$lib/utils/formatting/number/toPercentage.ts';
  import type { WatchHoverContent } from './toWatchHover.ts';

  const { hover }: { hover: WatchHoverContent } = $props();

  const toMinutesLine = (minutes: number | undefined) =>
    minutes === undefined ? undefined : toHumanMinutes(minutes);

  const toLines = (content: WatchHoverContent) => {
    switch (content.kind) {
      case 'add':
        return { main: m.tooltip_text_add_to_watched_history() };
      case 'unreleased':
        return { main: m.tooltip_text_not_released_yet() };
      case 'play':
        return {
          main: m.tooltip_text_watched_on({
            date: toHumanPatternDate(content.playedAt, 'd MMM yyyy'),
          }),
          detail: toMinutesLine(content.minutes),
        };
      case 'plays':
        return {
          main: countText.of({ count: content.count, unit: 'plays' }),
          detail: toMinutesLine(content.minutes),
        };
      case 'progress':
        return {
          main: m.tooltip_text_watched_percent({
            percent: toPercentage(content.progress.percent / 100),
          }),
          detail: content.progress.counts,
        };
    }
  };

  const lines = $derived(toLines(hover));
</script>

<div class="trakt-watch-hover" class:has-bar={hover.kind === 'progress'}>
  <p><MessageWithBold message={lines.main} /></p>
  {#if lines.detail}
    <TooltipDetail text={lines.detail} />
  {/if}
  {#if hover.kind === 'progress'}
    <!-- The percent line already says it, so a screen reader hears it once. -->
    <div class="hover-bar" aria-hidden="true">
      <TooltipBand edge="end" fill="none">
        <TickProgressBar
          value={hover.progress.percent}
          total={100}
          size="sm"
          label={m.text_watched_percent({
            percent: toPercentage(hover.progress.percent / 100),
          })}
        />
      </TooltipBand>
    </div>
  {/if}
</div>

<style lang="scss">
  .trakt-watch-hover {
    &.has-bar {
      min-width: var(--ni-240);
    }

    .hover-bar {
      --color-progress-track: var(--color-tooltip-progress-track);

      margin-block-start: var(--ni-10);
    }
  }
</style>
