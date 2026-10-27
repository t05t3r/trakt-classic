<script lang="ts">
  import { resolve } from '$app/paths';
  import * as m from '$lib/features/i18n/messages.ts';
  import { toHumanPatternDate } from '$lib/utils/formatting/date/toHumanPatternDate.ts';
  import type { ScheduleEpisodeProps } from './ScheduleEpisodeProps.ts';

  const props: ScheduleEpisodeProps = $props();

  const isSameShow = $derived(props.kind === 'episode' && props.sameShow);
  // An untagged same-show entry keeps its meta line, empty, for the line's top margin.
  const isMetaEmpty = $derived(isSameShow && !props.tag);

  function toAirLine({ airsAt, network }: { airsAt: Date; network: string | Nil }) {
    const time = toHumanPatternDate(airsAt, 'HH:mm');

    return network ? m.text_dashboard_schedule_air_line({ time, network }) : time;
  }
</script>

<div
  class="trakt-schedule-episode"
  class:is-same-show={isSameShow}
  data-media-key={props.mediaKey}
>
  {#if !isSameShow}
    <h4 class="schedule-title">
      <a class="title-link" href={resolve(props.href)}>{props.title}</a>
    </h4>
  {/if}
  {#if props.kind === 'episode'}
    <h5 class="schedule-episode-line">
      <a class="episode-link" href={resolve(props.episode.href)}>
        {#if props.episode.sxe}
          <span class="episode-sxe">{props.episode.sxe}</span>
        {/if}
        <span class="episode-title">{props.episode.text}</span>
      </a>
    </h5>
    <h6 class="schedule-meta" role={isMetaEmpty ? 'presentation' : undefined}>
      {@render props.tag?.()}{#if !isSameShow}
        <span class="air-line">{toAirLine(props)}</span>
      {/if}
    </h6>
  {:else if props.tagline || props.tag}
    <h6 class="schedule-meta">{@render props.tag?.()}{props.tagline}</h6>
  {/if}
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-schedule-episode {
    &:not(:first-child) {
      margin-block-start: var(--ni-15);
      padding-block-start: var(--ni-15);
      border-block-start: var(--ni-1) solid var(--color-border);
    }

    &.is-same-show {
      margin-block-start: var(--ni-10);
      padding-block-start: var(--ni-0);
      border-block-start: none;
    }

    // Phones keep only the padding between entries.
    @include for-mobile {
      &:not(:first-child) {
        margin-block-start: var(--ni-0);
        border-block-start: none;
      }

      // Outranks every rule above by specificity, whatever their order.
      &.is-same-show:not(:first-child) {
        margin-block-start: var(--ni-0);
        padding-block-start: var(--ni-0);
        border-block-start: none;
      }
    }

    .schedule-title,
    .schedule-episode-line,
    .schedule-meta {
      line-height: var(--line-height-heading);
    }

    .schedule-title,
    .schedule-episode-line {
      overflow-wrap: break-word;
    }

    .schedule-title {
      margin-block: var(--ni-0) var(--ni-5);
      font-size: var(--font-size-card-title-lg);
      font-weight: var(--font-weight-heading);
    }

    .title-link {
      color: var(--color-text-primary);
      text-decoration: none;
    }

    .schedule-episode-line {
      margin: var(--ni-0);
      font-size: var(--font-size-text);
    }

    .episode-link {
      color: var(--color-text-tertiary);
      text-decoration: none;
    }

    .episode-sxe {
      font-family: var(--font-family-heading);
      font-weight: var(--font-weight-heading-heavy);
    }

    .schedule-meta {
      margin-block: var(--ni-5) var(--ni-0);
      color: var(--color-text-help);
      font-size: var(--font-size-card-subtitle);
    }

    // A block of its own, as Classic's line sits under the tag.
    .air-line {
      display: block;
    }
  }
</style>
