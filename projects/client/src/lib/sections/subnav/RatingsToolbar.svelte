<script lang="ts">
  import ChoiceMenu from '$lib/components/menus/ChoiceMenu.svelte';
  import WatchedFilterMenu from '$lib/features/filters/WatchedFilterMenu.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import {
    RATING_VALUES,
    type RatingValue,
  } from '$lib/features/media-actions/RATING_VALUES.ts';
  import { toRatingLabel } from '$lib/features/media-actions/toRatingLabel.ts';
  import {
    RATINGS_TYPES,
    type RatingsTypeFilter,
  } from '$lib/features/ratings/RATINGS_TYPES.ts';
  import DividersToggle from './_internal/DividersToggle.svelte';
  import ItemCountStat from './_internal/ItemCountStat.svelte';
  import type { RatingsToolbarProps } from './_internal/RatingsToolbarProps.ts';
  import { thenChoose } from './_internal/thenChoose.ts';
  import { toTypeChoices } from './_internal/toTypeChoices.ts';
  import TypeMenu from './_internal/TypeMenu.svelte';
  import SubnavToolbar from './SubnavToolbar.svelte';

  const TYPE_CHOICES = toTypeChoices(RATINGS_TYPES);

  const RATING_CHOICES = RATING_VALUES.toReversed().map((value) => ({
    value,
    label: m.text_rating_choice({
      rating: value,
      label: toRatingLabel(Number(value)),
    }),
  }));

  const { params, dividers, itemCount, controls }: RatingsToolbarProps =
    $props();

  const type = $derived(params.type);
  const rating = $derived(params.rating);
  const watched = $derived(params.watched);

  const isTypeChanged = $derived($type !== 'all');
  const isRatingChanged = $derived($rating !== 'all');

  const selectType = (value: RatingsTypeFilter | null) =>
    params.setType(value ?? 'all');

  const selectRating = (value: RatingValue | null) =>
    params.setRating(value ?? 'all');
</script>

<SubnavToolbar {controls} changed={isTypeChanged || isRatingChanged}>
  {#snippet start()}
    <TypeMenu
      value={$type === 'all' ? null : $type}
      choices={TYPE_CHOICES}
      onChange={thenChoose(controls, selectType)}
      onRepick={controls.close}
    />
  {/snippet}
  {#snippet stats()}
    <ItemCountStat {itemCount} wideLabel />
  {/snippet}
  {#snippet options()}
    <ChoiceMenu
      label={m.label_rating_filter()}
      triggerLabel={(shown) => m.button_label_rating_filter({ rating: shown })}
      value={$rating === 'all' ? null : $rating}
      choices={RATING_CHOICES}
      all={m.button_text_rating_all()}
      onChange={thenChoose(controls, selectRating)}
      onRepick={controls.close}
    />
  {/snippet}
  {#snippet end()}
    <DividersToggle {dividers} />
    <WatchedFilterMenu value={$watched} onValueChange={params.setWatched} />
  {/snippet}
</SubnavToolbar>

