<script lang="ts">
  import EmptyState from '$lib/components/feedback/EmptyState.svelte';
  import StatusFrame from '$lib/components/feedback/StatusFrame.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { useShowProgressDetail } from '$lib/features/progress/stores/useShowProgressDetail.ts';
  import { fromRune } from '$lib/utils/store/fromRune.svelte.ts';
  import EpisodeSquares from './EpisodeSquares.svelte';
  import SeasonMenu from './SeasonMenu.svelte';
  import SeasonRow from './SeasonRow.svelte';
  import type { SeasonsListProps } from './SeasonsListProps.ts';
  import { toggleSeasonExpansion } from './toggleSeasonExpansion.ts';
  import { toListedSeasons } from './toListedSeasons.ts';

  const {
    show,
    describedBy,
    expansion,
    onexpansion,
    hidden,
    onhide,
    showsHidden,
  }: SeasonsListProps = $props();

  const listId = $props.id();

  const { seasons, seasonsWithHidden } = useShowProgressDetail(
    fromRune(() => show),
  );
  // The box's store serves the list's whole life.
  // svelte-ignore state_referenced_locally
  const { hiddenSeasons, unhiding, isUpdating, unhide } = hidden;
  const withHidden = seasonsWithHidden({
    shown: fromRune(() => showsHidden),
    held: unhiding,
  });
  const hiddenNumbers = $derived(
    new Set(($hiddenSeasons ?? []).map(({ number }) => number)),
  );
</script>

{#snippet none()}
  <EmptyState>{m.text_seasons_empty()}</EmptyState>
{/snippet}

{#snippet nothing()}{/snippet}

<StatusFrame status={$seasons} empty={none} {describedBy}>
  {#snippet children(rows)}
    <!-- A season with no aired episode has no episodes to expand. -->
    {@const listed = toListedSeasons({
      rows,
      withHidden: $withHidden.kind === 'ready' ? $withHidden.data : [],
      hiddenNumbers,
      showsHidden,
    })}
    {@const airedSeasons = listed
      .filter(({ progress }) => progress.total > 0)
      .map(({ progress }) => progress.number)}
    {#if listed.length > 0}
      <ul class="seasons-list-rows" role="list">
        {#each listed as row (row.progress.number)}
          {@const season = row.progress.number}
          {@const episodesId = `${listId}-${season}`}
          {@const isExpanded = expansion.has(season) &&
            airedSeasons.includes(season)}
          <li>
            <SeasonRow
              {row}
              {show}
              {isExpanded}
              controls={episodesId}
              ontoggle={() =>
                onexpansion(toggleSeasonExpansion({ expansion, season }))}
            >
              {#snippet menu()}
                <SeasonMenu
                  number={season}
                  isHidden={row.isHidden}
                  hides={row.hides}
                  isUpdating={$isUpdating}
                  {onhide}
                  onunhide={unhide}
                />
              {/snippet}
            </SeasonRow>
            <!-- A season with no aired episode has no toggle, so its announced ones show from the start. -->
            <div id={episodesId} class="seasons-list-episodes">
              {#if isExpanded || !airedSeasons.includes(season)}
                <EpisodeSquares {show} season={row.progress} />
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    {:else if !showsHidden}
      {@render none()}
    {/if}
  {/snippet}
</StatusFrame>
{#if showsHidden}
  <!-- The list above holds its seasons, so only its wait and its failure show here. -->
  <StatusFrame
    status={$withHidden}
    empty={nothing}
    children={nothing}
    {describedBy}
  />
{/if}

<style lang="scss">
  .seasons-list-rows {
    margin: var(--ni-0);
    padding: var(--ni-0);
    list-style: none;
  }

  .seasons-list-episodes:not(:empty) {
    padding-block: var(--ni-5);
  }
</style>
