<script lang="ts" generics="T">
  import DateDivider from '$lib/components/headers/DateDivider.svelte';
  import { bucketByLocalDay } from '$lib/utils/date/bucketByLocalDay.ts';
  import type { DividedPosterGridProps } from './DividedPosterGridProps.ts';
  import PosterGrid from './PosterGrid.svelte';

  const {
    items,
    key,
    item,
    columns,
    phoneDivider,
    dayOf,
    minutesOf,
    divided,
  }: DividedPosterGridProps<T> = $props();

  const id = $props.id();

  // Grouped in the viewer's zone, with no hydration gate: only client-side routes render it.
  const days = $derived(bucketByLocalDay({ rows: items, dayOf, minutesOf }));

  let hiddenDays: ReadonlySet<string> = $state(new Set());

  const toggleDay = (day: string) => {
    hiddenDays = new Set(
      hiddenDays.has(day)
        ? [...hiddenDays].filter((hidden) => hidden !== day)
        : [...hiddenDays, day],
    );
  };
</script>

<div class="trakt-divided-poster-grid">
  {#if divided}
    {#each days as day (day.key)}
      {@const controls = `${id}-${day.key}`}
      {@const expanded = !hiddenDays.has(day.key)}
      <DateDivider
        date={day.date}
        minutes={day.minutes}
        {expanded}
        {controls}
        onToggle={() => toggleDay(day.key)}
      />
      <div id={controls} class="day-cards">
        {#if expanded}
          <PosterGrid items={day.items} {key} {item} {columns} {phoneDivider} />
        {/if}
      </div>
    {/each}
  {:else}
    <PosterGrid {items} {key} {item} {columns} {phoneDivider} />
  {/if}
</div>

<style lang="scss">
  .trakt-divided-poster-grid {
    // Keeps the space below a hidden day, whose grid took its margin with it.
    .day-cards {
      margin-block-end: var(--gap-l);
    }
  }
</style>
