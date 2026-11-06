<script lang="ts">
  import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { useFavorite } from '$lib/features/media-actions/stores/useFavorite.ts';
  import { useWatched } from '$lib/features/media-actions/stores/useWatched.ts';
  import { useWatchlist } from '$lib/features/media-actions/stores/useWatchlist.ts';
  import { toPlayGate } from '$lib/features/media-actions/toPlayGate.ts';
  import { toWatchedProps } from '$lib/features/media-actions/toWatchedProps.ts';
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
  const { isWatchlisted } = useWatchlist({ type: target.type, id: target.id });
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

  // A Play exists whatever the watched history reads, so its card never adds another;
  // a partly watched show or season adds from its detail page only.
  const hasPlayRead = $derived(
    hasPlay || historyId !== undefined ? true : $hasPlayHeld,
  );
  const isPlayed = $derived(hasPlayRead === true);
  const isWatchShown = $derived(isPlayed || hasTargetAired(target));
  const watchHover = $derived(
    toWatchHover({
      target,
      isPlayed: hasPlayRead,
      playedAt,
      plays: $plays,
      watchedEpisodes: $watchedEpisodes,
    }),
  );
  // The favourite's Target is the card's show for an episode or a season, as `hasShowPlay` reads.
  const favoriteGate = $derived(
    toPlayGate({ isSet: $isFavorite, hasPlay: $hasShowPlay }),
  );

  const toggleWatched = () => {
    if (historyId !== undefined) return watched.removePlay(historyId);

    return isPlayed ? watched.remove() : watched.add();
  };
  const toggleFavorite = () =>
    $isFavorite ? favoriteStore?.remove() : favoriteStore?.add();
</script>

<div class="trakt-quick-actions" data-size={size}>
  <div class="actions">
    {#if isWatchShown}
      <!-- The tooltip opens over the card's title, whose click it must not take. -->
      <Tooltip
        side="bottom"
        disabled={watchHover === undefined}
        disableHoverableContent
        triggerProps={{ onclick: toggleWatched }}
      >
        {#snippet trigger({ props })}
          <QuickIcon
            {...props}
            action="watch"
            icon={IconCheck}
            label={isPlayed
            ? m.button_label_remove_from_watched({ title: target.title })
            : m.button_label_mark_as_watched({ title: target.title })}
            isSelected={isPlayed}
            isPending={$isWatchUpdating}
            isInert={!$isWatchedKnown || $isWatchUpdating}
          />
        {/snippet}
        {#snippet content()}
          {#if watchHover}
            <WatchHover hover={watchHover} />
          {/if}
        {/snippet}
      </Tooltip>
    {/if}
    <ListMenu type={target.type} id={target.id}>
      {#snippet trigger({ props })}
        <QuickIcon
          {...props}
          action="list"
          icon={IconAlignLeft}
          label={m.dropdown_label_add_remove_from_lists({ title: target.title })}
          isSelected={$isWatchlisted === true}
        />
      {/snippet}
    </ListMenu>
    {#if isFavorite}
      <QuickIcon
        action="favorite"
        icon={IconStarFilled}
        label={$isFavorite
        ? m.button_label_remove_from_favorites({ title: favoriteTarget.title })
        : m.button_label_add_to_favorites({ title: favoriteTarget.title })}
        isSelected={$isFavorite === true}
        isInert={favoriteGate === 'unknown'}
        blockedReason={favoriteGate === 'blocked'
        ? m.tooltip_text_watch_first_to_favorite()
        : undefined}
        onclick={toggleFavorite}
      />
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
