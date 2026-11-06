<script lang="ts">
  import DividedPosterGrid from '$lib/components/media/DividedPosterGrid.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { isHiddenAll } from '$lib/features/paging/isHiddenAll.ts';
  import RatingGridCard from '$lib/features/ratings/components/RatingGridCard.svelte';
  import {
    type RatingRow,
    type RatingsItemsValues,
    type RatingsReading,
    useRatingsItems,
  } from '$lib/features/ratings/stores/useRatingsItems.ts';
  import { useRatingsParams } from '$lib/features/ratings/stores/useRatingsParams.ts';
  import UserCoverPage from '$lib/sections/layout/UserCoverPage.svelte';
  import ListItemsSection from '$lib/sections/lists/ListItemsSection.svelte';
  import ListReader from '$lib/sections/lists/ListReader.svelte';
  import RatingsToolbar from '$lib/sections/subnav/RatingsToolbar.svelte';
  import { useDividers } from '$lib/stores/useDividers.ts';
  import { createKeyedReader } from '$lib/utils/store/createKeyedReader.ts';
  import { fromRune } from '$lib/utils/store/fromRune.svelte.ts';
  import { combineLatest, EMPTY, type Observable } from 'rxjs';

  const { filters }: { filters: string } = $props();

  const toEmptyText = (
    { type, rating }: RatingsItemsValues,
    read: RatingsReading | undefined,
  ) => {
    if (type !== 'all' || rating !== 'all') {
      return m.text_lists_empty_filtered();
    }
    if (read && isHiddenAll(read)) return m.text_lists_empty_filtered();

    return m.list_placeholder_ratings();
  };

  const params = useRatingsParams(fromRune(() => filters));
  const values = combineLatest({
    type: params.type,
    rating: params.rating,
    page: params.page,
  });

  const dividers = useDividers();
  const { shown } = dividers;

  const { latest: items, reading } = createKeyedReader<
    Observable<RatingsReading> | undefined,
    RatingsReading
  >({ initial: undefined, read: (current) => current ?? EMPTY });

  const valuesKey = $derived(JSON.stringify($values));
</script>

{#if $values}
  {@const current = $values}
  {#key valuesKey}
    <ListReader
      read={() =>
        useRatingsItems({
          values: current,
          watched: params.watched,
          replacePage: params.replacePage,
        })}
      onread={(next) => items.next(next)}
    />
  {/key}

  <UserCoverPage cover={$reading?.cover} selected="ratings">
    <ListItemsSection
      reading={$reading}
      emptyText={toEmptyText(current, $reading)}
    >
      {#snippet toolbar(controls)}
        <RatingsToolbar
          {params}
          {dividers}
          itemCount={$reading?.itemCount}
          {controls}
        />
      {/snippet}
      {#snippet grid(rows: ReadonlyArray<RatingRow>)}
        {#key valuesKey}
          <DividedPosterGrid
            items={rows}
            divided={$shown}
            dayOf={(row) => row.entry.ratedAt}
            key={(row) => row.entry.key}
          >
            {#snippet item(row)}
              <RatingGridCard {row} />
            {/snippet}
          </DividedPosterGrid>
        {/key}
      {/snippet}
    </ListItemsSection>
  </UserCoverPage>
{/if}
