<script lang="ts">
  import ActionButton from '$lib/components/buttons/ActionButton.svelte';
  import ActionSideIcon from '$lib/components/buttons/ActionSideIcon.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { useDrop } from '$lib/features/media-actions/stores/useDrop.ts';
  import { useFavorite } from '$lib/features/media-actions/stores/useFavorite.ts';
  import { useWatched } from '$lib/features/media-actions/stores/useWatched.ts';
  import { useWatchlist } from '$lib/features/media-actions/stores/useWatchlist.ts';
  import { toPlayGate } from '$lib/features/media-actions/toPlayGate.ts';
  import { toWatchedProps } from '$lib/features/media-actions/toWatchedProps.ts';
  import { countText } from '$lib/utils/formatting/number/countText.ts';
  import { toPercentage } from '$lib/utils/formatting/number/toPercentage.ts';
  import IconAlignLeft from '@tabler/icons-svelte/icons/align-left';
  import IconCheck from '@tabler/icons-svelte/icons/check';
  import IconCirclePlus from '@tabler/icons-svelte/icons/circle-plus';
  import IconStar from '@tabler/icons-svelte/icons/star';
  import IconStarFilled from '@tabler/icons-svelte/icons/star-filled';
  import { toActionUnderInfo } from '../_internal/toActionUnderInfo.ts';
  import { toWatchProgress } from '../_internal/toWatchProgress.ts';
  import ListMenu from './ListMenu.svelte';
  import HistoryChoice from './_internal/HistoryChoice.svelte';
  import MoreActionsMenu from './_internal/MoreActionsMenu.svelte';
  import type { ActionColumnProps } from './_internal/ActionColumnProps.ts';
  import { canAddPlay } from './_internal/canAddPlay.ts';
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
  const dropStore = show ? useDrop(show) : undefined;
  // svelte-ignore state_referenced_locally
  const favoriteStore = favorite &&
      (target.type === 'movie' || target.type === 'show')
    ? useFavorite({ type: target.type, id: target.id })
    : undefined;

  const {
    isWatchedKnown,
    pendingWatched,
    plays,
    lastWatchedAt,
    hasPlay,
    hasPlayHeld,
  } = watched;
  const isWatchUpdating = watched.isUpdating;
  const isDropped = dropStore?.isDropped;
  const isDropUpdating = dropStore?.isUpdating;
  const { isWatchlisted, listedAt } = watchlist;
  const isListUpdating = watchlist.isUpdating;
  const isFavorite = favoriteStore?.isFavorite;
  const isFavoriteUpdating = favoriteStore?.isUpdating;
  const favoritedAt = favoriteStore?.favoritedAt;

  const isAired = $derived(hasTargetAired(target));
  const favoriteGate = $derived(
    toPlayGate({ isSet: $isFavorite, hasPlay: $hasPlay }),
  );

  const shownProgress = $derived(
    progress?.kind === 'ready' ? progress.data : undefined,
  );
  const watchProgress = $derived(
    shownProgress && toWatchProgress({ ...shownProgress, plays: $plays }),
  );

  // A write's value wins at once; progress above 0 proves a Play the history may not read yet.
  const isHistorySelected = $derived.by(() => {
    if ($pendingWatched !== undefined) return $pendingWatched;
    if (progress?.kind === 'loading') return undefined;

    return shownProgress?.completed ? true : $hasPlayHeld;
  });

  // Only a known absence of Plays blocks it: an unknown history may hold one.
  const isHistoryBlocked = $derived(
    isHistorySelected === false && !isAired,
  );

  // A pending add's counts lag its fill, so it reads Watched with no under line until they arrive.
  const areCountsShown = $derived(
    isHistorySelected && $pendingWatched === undefined,
  );
  const shownWatchProgress = $derived(
    areCountsShown ? watchProgress : undefined,
  );

  // Only a show has a Drop, and Trakt takes one on a show with no plays but never lists it as dropped.
  const canDrop = $derived(
    show !== undefined && shownProgress !== undefined &&
      shownProgress.completed > 0 && isHistorySelected === true,
  );

  // Unknown or saving, either row would act on a state the viewer cannot see yet.
  const canDropRow = $derived(
    canDrop && $isDropped === false && !$isDropUpdating,
  );
  const canRestoreRow = $derived($isDropped === true && !$isDropUpdating);

  const historyLabel = $derived.by(() => {
    if (!isHistorySelected) return m.button_text_add_to_history();
    if (shownWatchProgress) {
      return m.text_watched_percent({
        percent: toPercentage(shownWatchProgress.percent / 100),
      });
    }
    if (areCountsShown && $plays) {
      return countText.of({ count: $plays, unit: 'plays' });
    }

    return m.button_text_watched();
  });

  const historyUnderInfo = $derived.by(() => {
    if (!areCountsShown) return undefined;
    if ($isDropped) {
      return toActionUnderInfo({
        kind: 'dropped',
        counts: shownWatchProgress?.counts,
      });
    }

    return shownWatchProgress?.counts ??
      toActionUnderInfo({ kind: 'played', at: $lastWatchedAt });
  });

  const toggleWatched = () =>
    isHistorySelected ? watched.remove() : watched.add('now');
  const toggleWatchlist = () =>
    $isWatchlisted ? watchlist.remove() : watchlist.add();
  const toggleFavorite = () =>
    $isFavorite ? favoriteStore?.remove() : favoriteStore?.add();
</script>

{#snippet historySide()}
  {#if canAddPlay(target)}
    <HistoryChoice onAdd={(at) => watched.add(at)} />
  {/if}
  <MoreActionsMenu
    {target}
    hasHistory={!!isHistorySelected}
    onDrop={canDropRow ? dropStore?.drop : undefined}
    onRestore={canRestoreRow ? dropStore?.restore : undefined}
  />
{/snippet}

{#snippet blockedHistorySide()}
  <ActionSideIcon
    disabled
    icon={IconCirclePlus}
    label={m.button_label_add_play()}
  />
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
  <ActionButton
    color="watch"
    icon={IconCheck}
    label={historyLabel}
    underInfo={historyUnderInfo}
    percent={shownWatchProgress?.percent}
    selected={isHistorySelected}
    isUpdating={$isWatchUpdating}
    isInert={!$isWatchedKnown || $isWatchUpdating}
    blockedReason={isHistoryBlocked
    ? m.tooltip_text_not_released_yet()
    : undefined}
    onclick={toggleWatched}
    side={isHistoryBlocked ? blockedHistorySide : historySide}
  />
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
      isInert={favoriteGate === 'unknown'}
      blockedReason={favoriteGate === 'blocked'
      ? m.tooltip_text_watch_first_to_favorite()
      : undefined}
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
