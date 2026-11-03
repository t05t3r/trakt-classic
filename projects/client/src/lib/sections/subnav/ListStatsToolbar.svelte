<script lang="ts" generics="T extends ListDisplayType">
  import SortDirectionToggle from '$lib/components/buttons/SortDirectionToggle.svelte';
  import ChoiceMenu from '$lib/components/menus/ChoiceMenu.svelte';
  import CountStat from '$lib/components/stats/CountStat.svelte';
  import HumanizedMinutes from '$lib/components/stats/HumanizedMinutes.svelte';
  import { GENRES } from '$lib/features/filters/GENRES.ts';
  import WatchedFilterMenu from '$lib/features/filters/WatchedFilterMenu.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { LIST_SORT } from '$lib/features/lists/LIST_SORT.ts';
  import type { ListDisplayType } from '$lib/features/lists/LIST_TYPES.ts';
  import type { SortBy } from '$lib/models/SortBy.ts';
  import ContainerPage from '$lib/sections/layout/ContainerPage.svelte';
  import { toGroupedNumber } from '$lib/utils/formatting/number/toGroupedNumber.ts';
  import { toPercentage } from '$lib/utils/formatting/number/toPercentage.ts';
  import { toTranslatedGenre } from '$lib/utils/formatting/string/toTranslatedGenre.ts';
  import IconCheck from '@tabler/icons-svelte/icons/check';
  import IconClockPlay from '@tabler/icons-svelte/icons/clock-play';
  import IconFile from '@tabler/icons-svelte/icons/file';
  import type { ListStatsToolbarProps } from './_internal/ListStatsToolbarProps.ts';

  const TYPE_LABELS: Record<ListDisplayType, () => string> = {
    movie: m.button_text_movies,
    show: m.button_text_shows,
    season: m.button_text_type_seasons,
    episode: m.button_text_type_episodes,
  };

  const SORT_LABELS: Record<SortBy, () => string> = {
    rank: m.button_text_sort_rank,
    added: m.button_text_sort_added_date,
    title: m.button_text_sort_title,
    released: m.button_text_sort_release_date,
    runtime: m.button_text_sort_runtime,
    popularity: m.button_text_sort_popularity,
    percentage: m.button_text_sort_rating,
    votes: m.button_text_sort_votes,
    my_rating: m.button_text_sort_my_rating,
  };

  const GENRE_CHOICES = GENRES.map((genre) => ({
    value: genre,
    label: toTranslatedGenre(genre),
  }));

  const SORT_CHOICES = LIST_SORT.sorts.map(({ by }) => ({
    value: by,
    label: SORT_LABELS[by](),
  }));

  const {
    params,
    watched,
    itemCount,
    minutes,
    pageCount,
    isPanelOpen,
    panelId,
    onChoose,
  }: ListStatsToolbarProps<T> = $props();

  const sort = $derived(params.sort);
  const type = $derived(params.type);
  const genre = $derived(params.genre);
  const watchedFilter = $derived(params.watched);

  const typeChoices = $derived(
    params.types.map((value) => ({ value, label: TYPE_LABELS[value]() })),
  );

  const hasRuntime = $derived(pageCount === undefined || pageCount <= 1);

  const thenChoose =
    <A extends ReadonlyArray<unknown>>(apply: (...args: A) => void) =>
    (...args: A) => {
      apply(...args);
      onChoose();
    };

  // Without an All row, the menu never reports null.
  const selectSort = (by: SortBy | null) => {
    if (by === null) return;
    thenChoose(params.selectSort)(by);
  };
</script>

{#snippet runtime()}
  {#if pageCount !== undefined && minutes !== undefined}
    <HumanizedMinutes {minutes} />
  {/if}
{/snippet}

<section class="trakt-list-stats-toolbar">
  <ContainerPage>
    <div class="toolbar-row">
      <div class="toolbar-stats">
        <CountStat
          icon={IconCheck}
          size="lg"
          value={watched ? toPercentage(watched.percentage / 100) : ''}
          label={m.text_lists_watched()}
          underCount={watched
            ? m.text_lists_watched_count({
              watched: toGroupedNumber(watched.watched),
              count: toGroupedNumber(watched.count),
            })
            : undefined}
        />
        {#if hasRuntime}
          <CountStat
            icon={IconClockPlay}
            size="lg"
            value={runtime}
            label={m.text_lists_runtime()}
          />
        {/if}
        <CountStat
          icon={IconFile}
          value={itemCount === undefined ? '' : toGroupedNumber(itemCount)}
          label={m.text_lists_items()}
        />
      </div>
      <div id={panelId} class="toolbar-options" class:is-open={isPanelOpen}>
        <div class="toolbar-filters">
          <ChoiceMenu
            label={m.label_list_type()}
            triggerLabel={(shown) => m.button_label_list_type({ type: shown })}
            value={$type}
            choices={typeChoices}
            all={m.button_text_type_all()}
            onChange={thenChoose(params.setType)}
          />
          <ChoiceMenu
            label={m.label_list_genre()}
            triggerLabel={(shown) => m.button_label_list_genre({ genre: shown })}
            value={$genre}
            choices={GENRE_CHOICES}
            all={m.button_text_genre_all()}
            onChange={thenChoose(params.setGenre)}
            isLimited
          />
        </div>
        <div class="toolbar-sorting">
          <ChoiceMenu
            label={m.label_sort_by()}
            triggerLabel={(shown) => m.button_label_sort_by({ sort: shown })}
            value={$sort.by}
            choices={SORT_CHOICES}
            onChange={selectSort}
          />
          <div class="toolbar-toggles">
            <span class="toolbar-direction">
              <SortDirectionToggle
                pressed={$sort.how === 'desc'}
                onToggle={thenChoose(params.reverseSort)}
              />
            </span>
            <WatchedFilterMenu
              value={$watchedFilter}
              onValueChange={thenChoose(params.setWatched)}
            />
          </div>
        </div>
      </div>
    </div>
  </ContainerPage>
</section>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-list-stats-toolbar {
    position: relative;
    padding-block: var(--ni-15);
    background: var(--color-surface-recessed);

    .toolbar-row {
      display: flex;
      align-items: center;
    }

    .toolbar-options {
      display: contents;
    }

    .toolbar-filters {
      order: -1;
      display: flex;
      align-items: center;
      gap: var(--ni-15);
      margin-inline-end: auto;
    }

    .toolbar-stats {
      --count-stat-font-size: var(--font-size-subnav-stat);

      display: flex;
      align-items: center;
      gap: var(--ni-15);
    }

    .toolbar-sorting {
      display: flex;
      align-items: center;
      margin-inline-start: var(--ni-15);
    }

    .toolbar-toggles {
      display: flex;
      align-items: center;
    }

    .toolbar-direction {
      display: inline-flex;
      margin-inline: var(--ni-4) var(--ni-7);
    }

    @include for-mobile {
      padding-block: var(--ni-0);

      .toolbar-stats {
        padding-block: var(--ni-8);
      }

      // The panel opens under the title bar that follows the toolbar.
      .toolbar-options {
        position: absolute;
        z-index: var(--layer-panel);
        inset-block-start: calc(100% + var(--subnav-panel-offset));
        inset-inline: var(--ni-0);
        display: none;
        flex-direction: column;
        align-items: center;
        gap: var(--ni-10);
        padding-block: var(--ni-11);
        background: var(--color-surface-recessed);

        &.is-open {
          display: flex;
        }
      }

      .toolbar-filters {
        flex-direction: column;
        gap: var(--ni-10);
        margin-inline-end: var(--ni-0);
      }

      .toolbar-sorting {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-self: stretch;
        margin-inline-start: var(--ni-0);

        // An empty first track, as wide as the toggles', centres the sort menu.
        &::before {
          content: '';
        }
      }
    }
  }
</style>
