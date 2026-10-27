<script lang="ts">
  import { resolve } from '$app/paths';
  import HumanizedMinutes from '$lib/components/stats/HumanizedMinutes.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { useQuery } from '$lib/features/query/useQuery.ts';
  import { userStatsQuery } from '$lib/requests/queries/users/userStatsQuery.ts';
  import ContainerPage from '$lib/sections/layout/ContainerPage.svelte';
  import { countText } from '$lib/utils/formatting/number/countText.ts';
  import { toGroupedNumber } from '$lib/utils/formatting/number/toGroupedNumber.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import IconDeviceTvOld from '@tabler/icons-svelte/icons/device-tv-old';
  import IconMovie from '@tabler/icons-svelte/icons/movie';

  const EPISODES_HISTORY = UrlBuilder.history.home('episodes');
  const SHOWS_HISTORY = UrlBuilder.history.home('shows');
  const MOVIES_HISTORY = UrlBuilder.history.home('movies');

  const query = useQuery(userStatsQuery({ slug: 'me' }));

  const stats = $derived($query.data);
  // An error still shows the cells, with dashes where no figures loaded.
  const showsCells = $derived(stats !== undefined || $query.status === 'error');
</script>

{#snippet figure(count: number | undefined)}
  <strong class="stats-number">
    {count === undefined
      ? m.text_dashboard_stats_unavailable()
      : toGroupedNumber(count)}
  </strong>
{/snippet}

{#snippet minutes(total: number | undefined)}
  <strong class="stats-number">
    {#if total === undefined}
      {m.text_dashboard_stats_unavailable()}
    {:else}
      <HumanizedMinutes minutes={total} swap={false} />
    {/if}
  </strong>
{/snippet}

<div class="trakt-stats-strip">
  <ContainerPage>
    {#if showsCells}
      <div class="stats-cells">
        <div class="stats-cell">
          <!-- The figures beside it link to the same page. -->
          <a
            class="stats-link stats-icon"
            href={resolve(EPISODES_HISTORY)}
            tabindex="-1"
            aria-hidden="true"
          >
            <IconDeviceTvOld class="stats-glyph" />
          </a>
          <a class="stats-link" href={resolve(EPISODES_HISTORY)}>
            {@render minutes(stats?.episodes.minutes)}
            {m.text_dashboard_stats_watched()}
          </a>
          <br />
          <a class="stats-link" href={resolve(EPISODES_HISTORY)}>
            {@render figure(stats?.episodes.watched)}
            {countText.word({ count: stats?.episodes.watched, unit: 'episodes' })}
          </a>
          {m.text_dashboard_stats_plays_bracket_open()}<a class="stats-link" href={resolve(EPISODES_HISTORY)}>
            {@render figure(stats?.episodes.plays)}
            {countText.word({ count: stats?.episodes.plays, unit: 'plays' })}
          </a>
          <a class="stats-link" href={resolve(SHOWS_HISTORY)}>
            {m.text_dashboard_stats_of()}
            {@render figure(stats?.shows.watched)}
            {countText.word({ count: stats?.shows.watched, unit: 'shows' })}</a>{m.text_dashboard_stats_plays_bracket_close()}
        </div>

        <div class="stats-cell">
          <a class="stats-link" href={resolve(MOVIES_HISTORY)}>
            <span class="stats-icon"><IconMovie class="stats-glyph" /></span>
            {@render minutes(stats?.movies.minutes)}
            {m.text_dashboard_stats_watched()}
            <br />
            {@render figure(stats?.movies.watched)}
            {countText.word({ count: stats?.movies.watched, unit: 'movies' })}
            {m.text_dashboard_stats_plays_bracket_open()}{@render figure(stats?.movies.plays)}
            {countText.word({ count: stats?.movies.plays, unit: 'plays' })}{m.text_dashboard_stats_plays_bracket_close()}
          </a>
        </div>
      </div>
    {/if}
  </ContainerPage>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-stats-strip {
    box-sizing: border-box;
    min-height: var(--stats-strip-height);
    font-size: var(--font-size-stats-strip);
    background: var(--color-overlay-dark-50);

    .stats-cells {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      column-gap: var(--gutter);
      padding-block: var(--ni-10);
    }

    .stats-cell {
      display: flow-root;
    }

    .stats-link {
      color: var(--color-text-primary);
      text-decoration: none;
      transition: color var(--transition-default);

      &:hover {
        color: var(--color-link);
      }
    }

    .stats-icon {
      display: flex;
      justify-content: center;
      float: inline-start;
      width: var(--stats-icon-width);
      margin-block-start: var(--ni-4);
      margin-inline-end: var(--ni-10);

      :global(.stats-glyph) {
        width: var(--icon-size-stats);
        height: var(--icon-size-stats);
        stroke-width: var(--icon-stroke-chrome);
      }
    }

    .stats-number {
      font-family: var(--font-family-heading);
      font-weight: var(--font-weight-heading-heavy);
    }

    @include for-tablet-sm-and-below {
      .stats-cell {
        margin-block-end: var(--ni-10);
      }

      .stats-icon {
        margin-inline-end: var(--ni-5);
      }
    }

    @include for-mobile {
      .stats-cells {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  }
</style>
