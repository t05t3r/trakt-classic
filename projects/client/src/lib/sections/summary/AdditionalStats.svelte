<script lang="ts">
  import { resolve } from '$app/paths';
  import HumanizedMinutes from '$lib/components/stats/HumanizedMinutes.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { useHydrated } from '$lib/utils/hydration/hydration.ts';
  import type { StatsValue } from './StatsRow.ts';
  import type { AdditionalStatsProps } from './AdditionalStatsProps.ts';

  const { rows }: AdditionalStatsProps = $props();

  const hydrated = useHydrated();
  const shown = $derived(rows.filter((row) => !row.zoned || $hydrated));
</script>

<!-- Whitespace between these nodes would render as text, so each value stays on one line. -->
{#snippet primary(entry: StatsValue)}
  {#if 'minutes' in entry}<HumanizedMinutes minutes={entry.minutes} />{:else if entry.href}<a class="stats-link" href={resolve(entry.href)}>{entry.text}</a>{:else}{entry.text}{/if}
{/snippet}

{#snippet value(entry: StatsValue)}
  {#if entry.alt}{@render primary(entry)} <span class="stats-alt">{entry.alt}</span>{:else}{@render primary(entry)}{/if}
{/snippet}

{#if shown.length > 0}
  <ul class="trakt-additional-stats" role="list">
    {#each shown as row (row.key)}
      <li class="stats-row">
        <span class="stats-label">{row.label}</span>{#each row.values as entry, index (entry.key)}{index > 0 ? m.text_stats_value_separator() : ''}{@render value(entry)}{/each}
      </li>
    {/each}
  </ul>
{/if}

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-additional-stats {
    margin: var(--ni-0) var(--ni-0) var(--ni-20);
    padding: var(--ni-0);
    list-style: none;
    color: var(--color-text-primary);
    font-family: var(--font-family-body);
    font-size: var(--font-size-text);

    .stats-row {
      display: inline-block;
      margin-block: var(--ni-0) var(--ni-2);
      margin-inline: var(--ni-0) var(--ni-20);

      @include for-mobile {
        display: block;
        margin: var(--ni-0) var(--ni-0) var(--ni-1);
      }
    }

    .stats-label {
      margin-inline-end: var(--ni-7);
      color: var(--color-text-help);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-heading-muted);
      font-weight: var(--font-weight-heading);
      text-transform: uppercase;
    }

    .stats-link {
      color: var(--color-text-primary);
      text-decoration: none;
      transition: color var(--transition-default);

      @include for-mouse {
        &:hover {
          color: var(--color-link);
        }
      }
    }

    .stats-alt {
      color: var(--color-text-help);
      font-style: italic;
    }
  }
</style>
