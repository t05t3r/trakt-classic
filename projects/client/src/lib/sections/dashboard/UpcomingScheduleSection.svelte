<script lang="ts">
  import EpisodeTypeTag from '$lib/components/badges/EpisodeTypeTag.svelte';
  import SectionState from '$lib/components/feedback/SectionState.svelte';
  import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
  import SeeMoreLink from '$lib/components/headers/SeeMoreLink.svelte';
  import ScheduleEpisode from '$lib/components/media/ScheduleEpisode.svelte';
  import type { ScheduleDay } from '$lib/features/dashboard/models/ScheduleDay.ts';
  import { useUpcomingSchedule } from '$lib/features/dashboard/stores/useUpcomingSchedule.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import LazyImage from '$lib/features/image/components/LazyImage.svelte';
  import { dedupe } from '$lib/utils/array/dedupe.ts';
  import { toHumanPatternDate } from '$lib/utils/formatting/date/toHumanPatternDate.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import IconCalendar from '@tabler/icons-svelte/icons/calendar';
  import type { Attachment } from 'svelte/attachments';
  import {
    type ScheduleEpisodeEntry,
    toScheduleEpisodes,
  } from './_internal/toScheduleEpisodes.ts';

  const LOADING: SectionStatus<never> = { kind: 'loading' };
  const NEAR_DATE_COUNT = 2;

  const schedule = useUpcomingSchedule();
  const headingId = $props.id();

  // Leaving an entry keeps its poster, as Classic's hover does.
  let enteredMedia: Readonly<Record<string, string>> = $state({});

  // A poster a refetch dropped falls back to the date's first.
  function shownMediaKey(dayKey: string, posters: ReadonlyArray<{ key: string }>) {
    const entered = enteredMedia[dayKey];

    return posters.some(({ key }) => key === entered) ? entered : posters.at(0)?.key;
  }

  // Delegated to the entries' parent, as an entry is a static element.
  const showPosterOnEnter =
    (dayKey: string): Attachment<HTMLElement> =>
    (list) => {
      const showPoster = ({ target }: Event) => {
        if (!(target instanceof Element)) return;

        const entry = target.closest<HTMLElement>('[data-media-key]');
        if (!entry || !list.contains(entry)) return;

        const { mediaKey } = entry.dataset;
        if (!mediaKey) return;
        if (enteredMedia[dayKey] === mediaKey) return;

        enteredMedia = { ...enteredMedia, [dayKey]: mediaKey };
      };
      list.addEventListener('mouseover', showPoster);
      list.addEventListener('focusin', showPoster);

      return () => {
        list.removeEventListener('mouseover', showPoster);
        list.removeEventListener('focusin', showPoster);
      };
    };
</script>

{#snippet scheduleHelp()}
  {m.text_dashboard_help_schedule()}
{/snippet}

{#snippet tools()}
  <SeeMoreLink href={UrlBuilder.calendar()} label={m.text_nav_calendar()} />
{/snippet}

{#snippet scheduleEntries(
  entries: ReadonlyArray<ScheduleEpisodeEntry>,
  swapPoster?: Attachment<HTMLElement>,
)}
  <div class="schedule-entries" {@attach swapPoster}>
    {#each entries as { key, props, tagType, media } (key)}
      {#snippet tag()}
        {#if tagType}
          <EpisodeTypeTag type={tagType} />
        {/if}
      {/snippet}
      <ScheduleEpisode {...props} mediaKey={media.key} tag={tagType ? tag : undefined} />
    {/each}
  </div>
{/snippet}

{#snippet scheduleDay(day: ScheduleDay, column: 'near' | 'far')}
  {@const entries = toScheduleEpisodes({ lines: day.items })}
  <div
    class="schedule-day"
    role="group"
    aria-labelledby="{headingId}-{day.key}"
    data-grid-column
    data-column={column}
  >
    <h3 class="schedule-day-heading" id="{headingId}-{day.key}">
      <strong class="day-weekday">{toHumanPatternDate(day.date, 'EEEE')}</strong>
      {toHumanPatternDate(day.date, 'd MMM')}
    </h3>
    {#if column === 'near'}
      {@const posters = dedupe((media) => media.key, entries.map(({ media }) => media))}
      {@const shownKey = shownMediaKey(day.key, posters)}
      <div class="schedule-day-body" data-layout="grid">
        <div class="schedule-poster-column" data-grid-column>
          {#each posters as media (media.key)}
            <div class="schedule-poster" class:is-shown={media.key === shownKey}>
              <LazyImage src={media.poster} alt="" kind="poster" />
            </div>
          {/each}
        </div>
        <div class="schedule-entries-column" data-grid-column>
          {@render scheduleEntries(entries, showPosterOnEnter(day.key))}
        </div>
      </div>
    {:else}
      {@render scheduleEntries(entries)}
    {/if}
  </div>
{/snippet}

<div class="trakt-upcoming-schedule-section">
  <SectionState
    header={{
      title: m.text_dashboard_title_schedule(),
      icon: IconCalendar,
      helpText: scheduleHelp,
      tools,
    }}
    status={$schedule ?? LOADING}
    emptyText={m.text_dashboard_empty_schedule()}
  >
    {#snippet children(days)}
      {@const farDays = days.slice(NEAR_DATE_COUNT)}
      <div class="schedule-columns" data-layout="grid">
        <div class="schedule-near-column" data-grid-column>
          <div class="schedule-days" data-layout="grid">
            {#each days.slice(0, NEAR_DATE_COUNT) as day (day.key)}
              {@render scheduleDay(day, 'near')}
            {/each}
          </div>
        </div>
        {#if farDays.length > 0}
          <div class="schedule-far-column" data-grid-column>
            <div class="schedule-days" data-layout="grid">
              {#each farDays as day (day.key)}
                {@render scheduleDay(day, 'far')}
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/snippet}
  </SectionState>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-upcoming-schedule-section {
    .schedule-near-column {
      --grid-column-span-tablet: var(--schedule-near-column-span-tablet);
      --grid-column-span-desktop: var(--schedule-near-column-span-desktop);
    }

    .schedule-far-column {
      --grid-column-span-desktop: var(--schedule-far-column-span-desktop);

      @include for-tablet-sm {
        display: none;
      }
    }

    .schedule-day[data-column='near'] {
      --grid-column-span-tablet: var(--schedule-day-column-span);
      --grid-column-span-desktop: var(--schedule-day-column-span);
    }

    .schedule-day[data-column='far'] {
      --grid-column-span-tablet: var(--schedule-far-day-column-span);
      --grid-column-span-desktop: var(--schedule-far-day-column-span);
    }

    .schedule-poster-column {
      position: relative;
      --grid-column-span-tablet: var(--schedule-poster-column-span-tablet);
      --grid-column-span-desktop: var(--schedule-poster-column-span-desktop);

      @include for-mobile {
        display: none;
      }
    }

    // Stacked out of the flow, so the entries alone set the date's height.
    .schedule-poster {
      position: absolute;
      inset-block-start: var(--ni-0);
      inset-inline: var(--ni-0);
      padding-inline: var(--gutter-half);
      opacity: 0;
      transition: opacity var(--transition-default);

      &.is-shown {
        opacity: 1;
      }
    }

    .schedule-entries-column {
      --grid-column-span-tablet: var(--schedule-entries-column-span-tablet);
      --grid-column-span-desktop: var(--schedule-entries-column-span-desktop);
    }

    .schedule-day-heading {
      margin-block-end: var(--ni-15);
      font-size: var(--font-size-heading-muted);
      line-height: var(--line-height-heading);
      text-transform: uppercase;

      .day-weekday {
        font-weight: var(--font-weight-heading);
      }

      @include for-mobile {
        margin-block: var(--ni-20) var(--ni-5);
        padding-block-end: var(--ni-5);
        border-block-end: var(--ni-1) solid var(--color-border);
      }
    }
  }
</style>
