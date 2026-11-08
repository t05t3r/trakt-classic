<script lang="ts">
  import MessageWithBold from '$lib/components/text/MessageWithBold.svelte';
  import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { useFavorite } from '$lib/features/media-actions/stores/useFavorite.ts';
  import { useWatched } from '$lib/features/media-actions/stores/useWatched.ts';
  import { useWatchlist } from '$lib/features/media-actions/stores/useWatchlist.ts';
  import { toPlayGate } from '$lib/features/media-actions/toPlayGate.ts';
  import { toWatchedProps } from '$lib/features/media-actions/toWatchedProps.ts';
  import { toHumanPatternDate } from '$lib/utils/formatting/date/toHumanPatternDate.ts';
  import IconAlignLeft from '@tabler/icons-svelte/icons/align-left';
  import IconCheck from '@tabler/icons-svelte/icons/check';
  import IconStarFilled from '@tabler/icons-svelte/icons/star-filled';
  import ListMenu from './ListMenu.svelte';
  import QuickIcon from './_internal/QuickIcon.svelte';
  import { hasTargetAired } from './_internal/hasTargetAired.ts';
  import { toWatchHover } from './_internal/toWatchHover.ts';
  import WatchHover from './_internal/WatchHover.svelte';
  import type {
    QuickActionsProps,
    QuickActionsTarget,
  } from './QuickActionsProps.ts';

  const {
    target,
    size = 'full',
    favorite = false,
    historyId,
    playedAt,
    hasPlay,
    metadata,
  }: QuickActionsProps = $props();

  // A new Target needs a new strip, so these stores serve the strip's whole life.
  // svelte-ignore state_referenced_locally
  const watched = useWatched(toWatchedProps(target));
  const {
    hasPlayHeld,
    isWatchedKnown,
    isUpdating: isWatchUpdating,
    hasShowPlay,
    plays,
    watchedEpisodes,
  } = watched;
  // svelte-ignore state_referenced_locally
  const { isWatchlisted, listedAt } = useWatchlist({
    type: target.type,
    id: target.id,
  });
  // Classic favourites an episode or season card's show, not the card's own media.
  function toFavoriteTarget(media: QuickActionsTarget) {
    return media.type === 'episode' || media.type === 'season'
      ? { type: 'show', id: media.show.id, title: media.show.title } as const
      : { type: media.type, id: media.id, title: media.title };
  }

  // Callers key on the Target and pass a constant favorite, so this store lasts the strip's life.
  // svelte-ignore state_referenced_locally
  const favoriteTarget = toFavoriteTarget(target);
  // svelte-ignore state_referenced_locally
  const favoriteStore = favorite
    ? useFavorite({ type: favoriteTarget.type, id: favoriteTarget.id })
    : undefined;
  const isFavorite = favoriteStore?.isFavorite;
  const favoritedAt = favoriteStore?.favoritedAt;

  // A Play exists whatever the watched history reads, so its card never adds another;
  // a partly watched show or season adds from its detail page only.
  const hasPlayRead = $derived(
    hasPlay || historyId !== undefined ? true : $hasPlayHeld,
  );
  const isPlayed = $derived(hasPlayRead === true);
  // Only a known absence of Plays blocks it: an unknown history may hold one.
  const isUnreleased = $derived(
    hasPlayRead === false && !hasTargetAired(target),
  );
  const watchHover = $derived(
    toWatchHover({
      target,
      isPlayed: hasPlayRead,
      playedAt,
      plays: $plays,
      watchedEpisodes: $watchedEpisodes,
    }),
  );
  const watchLabel = $derived.by(() => {
    if (isPlayed) return m.button_label_remove_from_watched({ title: target.title });

    const action = m.button_label_mark_as_watched({ title: target.title });

    // A touch screen reader never gets the tooltip, so the name holds its reason.
    return isUnreleased
      ? m.button_label_blocked_action({
        action,
        reason: m.tooltip_text_not_released_yet(),
      })
      : action;
  });
  // The favourite's Target is the card's show for an episode or a season, as `hasShowPlay` reads.
  const favoriteGate = $derived(
    toPlayGate({ isSet: $isFavorite, hasPlay: $hasShowPlay }),
  );
  const toAddedDate = (at: Date | Nil) =>
    at ? toHumanPatternDate(at, 'd MMM yyyy') : undefined;
  const listHover = $derived.by(() => {
    if ($isWatchlisted !== true) return m.button_label_add_to_list();

    const date = toAddedDate($listedAt);

    return date
      ? m.tooltip_text_added_to_watchlist_on({ date })
      : m.button_text_in_watchlist();
  });
  const favoriteHover = $derived.by(() => {
    if (favoriteGate === 'blocked') return m.tooltip_text_watch_first_to_favorite();
    if (!$isFavorite) return m.button_text_add_to_favorites();

    const date = toAddedDate($favoritedAt);

    return date
      ? m.tooltip_text_added_to_favorites_on({ date })
      : m.button_text_favorited();
  });
  const favoriteLabel = $derived.by(() => {
    if ($isFavorite) return m.button_label_remove_from_favorites({ title: favoriteTarget.title });

    const action = m.button_label_add_to_favorites({ title: favoriteTarget.title });

    return favoriteGate === 'blocked'
      ? m.button_label_blocked_action({ action, reason: favoriteHover })
      : action;
  });

  const toggleWatched = () => {
    if (historyId !== undefined) return watched.removePlay(historyId);

    return isPlayed ? watched.remove() : watched.add();
  };
  const toggleFavorite = () =>
    $isFavorite ? favoriteStore?.remove() : favoriteStore?.add();
</script>

<div class="trakt-quick-actions" data-size={size}>
  <div class="actions">
    <!-- Always rendered, so a remove that leaves it blocked keeps the focus. The tooltip opens over the card's title, whose click it must not take. -->
    <Tooltip
      side="bottom"
      disabled={watchHover === undefined}
      disableHoverableContent
      keepOpenOnPress={isUnreleased}
      triggerProps={{ onclick: toggleWatched }}
    >
      {#snippet trigger({ props })}
        <QuickIcon
          {...props}
          action="watch"
          icon={IconCheck}
          label={watchLabel}
          isSelected={isPlayed}
          isPending={$isWatchUpdating}
          isInert={!$isWatchedKnown || $isWatchUpdating}
          isBlocked={isUnreleased}
        />
      {/snippet}
      {#snippet content()}
        {#if watchHover}
          <WatchHover hover={watchHover} />
        {/if}
      {/snippet}
    </Tooltip>
    <ListMenu type={target.type} id={target.id}>
      {#snippet trigger({ props: menuProps })}
        <Tooltip
          side="bottom"
          disableHoverableContent
          triggerProps={menuProps}
        >
          {#snippet trigger({ props })}
            <QuickIcon
              {...props}
              action="list"
              icon={IconAlignLeft}
              label={m.dropdown_label_add_remove_from_lists({ title: target.title })}
              isSelected={$isWatchlisted === true}
            />
          {/snippet}
          {#snippet content()}
            <p><MessageWithBold message={listHover} /></p>
          {/snippet}
        </Tooltip>
      {/snippet}
    </ListMenu>
    {#if isFavorite}
      <Tooltip
        side="bottom"
        disabled={favoriteGate === 'unknown'}
        disableHoverableContent
        keepOpenOnPress={favoriteGate === 'blocked'}
        triggerProps={{ onclick: toggleFavorite }}
      >
        {#snippet trigger({ props })}
          <QuickIcon
            {...props}
            action="favorite"
            icon={IconStarFilled}
            label={favoriteLabel}
            isSelected={$isFavorite === true}
            isInert={favoriteGate === 'unknown'}
            isBlocked={favoriteGate === 'blocked'}
          />
        {/snippet}
        {#snippet content()}
          <p><MessageWithBold message={favoriteHover} /></p>
        {/snippet}
      </Tooltip>
    {/if}
  </div>
  {#if metadata}
    <div class="metadata">{@render metadata(hasPlayRead)}</div>
  {/if}
</div>

<style lang="scss">
  .trakt-quick-actions {
    --quick-icon-slot-width: var(--quick-icon-width);
    --quick-icon-slot-height: var(--quick-icons-height);
    --quick-icon-glyph-size: var(--icon-size-strip-lg);
    --quick-icon-star-size: var(--icon-size-strip-star-lg);

    display: flex;
    align-items: center;
    height: var(--quick-icons-height);

    &[data-size='smaller'] {
      --quick-icon-slot-width: var(--quick-icon-width-sm);
      --quick-icon-slot-height: var(--quick-icons-height-sm);
      --quick-icon-glyph-size: var(--icon-size-strip);
      --quick-icon-star-size: var(--icon-size-strip-star);

      height: var(--quick-icons-height-sm);
    }

    .actions {
      display: flex;
    }

    .metadata {
      margin-inline-start: auto;
      padding-inline-end: var(--ni-10);
    }

    &[data-size='smaller'] .metadata {
      padding-inline-end: var(--ni-5);
    }
  }
</style>
