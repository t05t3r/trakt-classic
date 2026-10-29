<script lang="ts">
  import ActionButton from '$lib/components/buttons/ActionButton.svelte';
  import ActionSideIcon from '$lib/components/buttons/ActionSideIcon.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { useDrop } from '$lib/features/media-actions/stores/useDrop.ts';
  import { useFavorite } from '$lib/features/media-actions/stores/useFavorite.ts';
  import { useWatched } from '$lib/features/media-actions/stores/useWatched.ts';
  import { useWatchlist } from '$lib/features/media-actions/stores/useWatchlist.ts';
  import { toWatchedProps } from '$lib/features/media-actions/toWatchedProps.ts';
  import { isProgressComplete } from '$lib/utils/media/isProgressComplete.ts';
  import IconAlignLeft from '@tabler/icons-svelte/icons/align-left';
  import IconCheck from '@tabler/icons-svelte/icons/check';
  import IconCircleMinus from '@tabler/icons-svelte/icons/circle-minus';
  import IconCirclePlus from '@tabler/icons-svelte/icons/circle-plus';
  import IconPlayerTrackPrev from '@tabler/icons-svelte/icons/player-track-prev';
  import IconStar from '@tabler/icons-svelte/icons/star';
  import IconStarFilled from '@tabler/icons-svelte/icons/star-filled';
  import { toActionUnderInfo } from '../_internal/toActionUnderInfo.ts';
  import DropMenu from './DropMenu.svelte';
  import ListMenu from './ListMenu.svelte';
  import HistoryChoice from './_internal/HistoryChoice.svelte';
  import type { ActionColumnProps } from './_internal/ActionColumnProps.ts';
  import { hasTargetAired } from './_internal/hasTargetAired.ts';

  const { target, progress, favorite = false }: ActionColumnProps = $props();

  // Callers key on the Target and pass a constant favorite, so these stores serve the column's whole life.
  // svelte-ignore state_referenced_locally
  const watched = useWatched(toWatchedProps(target));
  // svelte-ignore state_referenced_locally
  const watchlist = useWatchlist({ type: target.type, id: target.id });
  // svelte-ignore state_referenced_locally
  const show = target.type === 'show'
    ? { id: target.id, title: target.title }
    : undefined;
  const isDropped = show ? useDrop(show).isDropped : undefined;
  // svelte-ignore state_referenced_locally
  const favoriteStore = favorite &&
      (target.type === 'movie' || target.type === 'show')
    ? useFavorite({ type: target.type, id: target.id })
    : undefined;

  const { isWatched, isWatchedKnown, pendingWatched, plays, lastWatchedAt } =
    watched;
  const isWatchUpdating = watched.isUpdating;
  const { isWatchlisted, listedAt } = watchlist;
  const isListUpdating = watchlist.isUpdating;
  const isFavorite = favoriteStore?.isFavorite;
  const isFavoriteUpdating = favoriteStore?.isUpdating;
  const favoritedAt = favoriteStore?.favoritedAt;

  const isAired = $derived(hasTargetAired(target));

  const hasProgress = $derived(
    target.type === 'show' || target.type === 'season',
  );
  const isProgressLoading = $derived(
    hasProgress && progress?.kind === 'loading',
  );
  // A show or season follows its progress while that loads or is ready, else reads its history as a movie does.
  const followsProgress = $derived(
    isProgressLoading || (hasProgress && progress?.kind === 'ready'),
  );
  const shownProgress = $derived(
    progress?.kind === 'ready' ? progress.data : undefined,
  );

  // A pending write's value until it lands, then the progress.
  const isProgressSelected = () =>
    $pendingWatched ?? (shownProgress && isProgressComplete(shownProgress));

  // A dropped show reads unwatched, but only once its progress is no longer loading.
  const isHistorySelected = $derived.by(() => {
    if (isProgressLoading) return isProgressSelected();
    if ($isDropped) return false;

    return followsProgress ? isProgressSelected() : $isWatched;
  });

  // Only a show has a Drop, and Trakt takes one on a show with no plays but never lists it as dropped.
  const canDrop = $derived(
    show !== undefined && shownProgress !== undefined &&
      shownProgress.completed > 0,
  );

  const historyUnderInfo = $derived.by(() => {
    if ($isDropped) return toActionUnderInfo({ kind: 'dropped' });
    if (followsProgress) {
      return shownProgress &&
        toActionUnderInfo({ kind: 'episodes', ...shownProgress });
    }
    if (!$isWatched) return undefined;

    return toActionUnderInfo({
      kind: 'plays',
      count: $plays ?? 0,
      lastWatchedAt: $lastWatchedAt,
    });
  });

  const toggleWatched = () =>
    isHistorySelected ? watched.remove() : watched.add('now');
  const toggleWatchlist = () =>
    $isWatchlisted ? watchlist.remove() : watchlist.add();
  const toggleFavorite = () =>
    $isFavorite ? favoriteStore?.remove() : favoriteStore?.add();
</script>

{#snippet historySide()}
  <HistoryChoice onAdd={(at) => watched.add(at)} />
  {#if show && ($isDropped || canDrop)}
    <DropMenu {show}>
      {#snippet trigger({ props })}
        <ActionSideIcon
          {...props}
          icon={IconCircleMinus}
          label={m.button_label_drop()}
        />
      {/snippet}
      {#snippet restoreTrigger({ props })}
        <ActionSideIcon
          {...props}
          icon={IconPlayerTrackPrev}
          label={m.button_label_restore()}
        />
      {/snippet}
    </DropMenu>
  {/if}
{/snippet}

{#snippet watchlistSide()}
  <ListMenu type={target.type} id={target.id}>
    {#snippet trigger({ props })}
      <ActionSideIcon
        {...props}
        icon={IconCirclePlus}
        label={m.button_label_add_to_list()}
      />
    {/snippet}
  </ListMenu>
{/snippet}

<div class="trakt-action-column">
  {#if isAired}
    <ActionButton
      color="watch"
      icon={IconCheck}
      label={isHistorySelected
      ? m.button_text_watched()
      : m.button_text_add_to_history()}
      underInfo={historyUnderInfo}
      selected={isHistorySelected}
      isUpdating={$isWatchUpdating}
      isInert={!$isWatchedKnown || $isWatchUpdating}
      onclick={toggleWatched}
      side={historySide}
    />
  {/if}
  <ActionButton
    color="list"
    icon={IconAlignLeft}
    label={$isWatchlisted
    ? m.button_text_in_watchlist()
    : m.button_text_add_to_watchlist()}
    underInfo={$isWatchlisted
    ? toActionUnderInfo({ kind: 'added', at: $listedAt })
    : undefined}
    selected={$isWatchlisted}
    isUpdating={$isListUpdating}
    onclick={toggleWatchlist}
    side={watchlistSide}
  />
  {#if isFavorite}
    <ActionButton
      color="favorite"
      icon={$isFavorite ? IconStarFilled : IconStar}
      label={$isFavorite
      ? m.button_text_favorited()
      : m.button_text_add_to_favorites()}
      underInfo={$isFavorite
      ? toActionUnderInfo({ kind: 'added', at: $favoritedAt })
      : undefined}
      selected={$isFavorite}
      isUpdating={$isFavoriteUpdating}
      onclick={toggleFavorite}
    />
  {/if}
</div>

<style lang="scss">
  .trakt-action-column {
    display: flex;
    flex-direction: column;
    gap: var(--ni-5);
  }
</style>
