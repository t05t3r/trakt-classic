<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import { useFavorite } from '$lib/features/media-actions/stores/useFavorite.ts';
  import { useWatched } from '$lib/features/media-actions/stores/useWatched.ts';
  import { useWatchlist } from '$lib/features/media-actions/stores/useWatchlist.ts';
  import { toWatchedProps } from '$lib/features/media-actions/toWatchedProps.ts';
  import IconAlignLeft from '@tabler/icons-svelte/icons/align-left';
  import IconCheck from '@tabler/icons-svelte/icons/check';
  import IconStarFilled from '@tabler/icons-svelte/icons/star-filled';
  import ListMenu from './ListMenu.svelte';
  import QuickIcon from './_internal/QuickIcon.svelte';
  import { hasTargetAired } from './_internal/hasTargetAired.ts';
  import type {
    QuickActionsProps,
    QuickActionsTarget,
  } from './QuickActionsProps.ts';

  const {
    target,
    size = 'full',
    favorite = false,
    metadata,
  }: QuickActionsProps = $props();

  // A new Target needs a new strip, so these stores serve the strip's whole life.
  // svelte-ignore state_referenced_locally
  const watched = useWatched(toWatchedProps(target));
  const { isWatched, isWatchedKnown, isUpdating: isWatchUpdating } = watched;
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

  const isAired = $derived(hasTargetAired(target));

  const toggleWatched = () => ($isWatched ? watched.remove() : watched.add());
  const toggleFavorite = () =>
    $isFavorite ? favoriteStore?.remove() : favoriteStore?.add();
</script>

<div class="trakt-quick-actions" data-size={size}>
  <div class="actions">
    {#if isAired}
      <QuickIcon
        action="watch"
        icon={IconCheck}
        label={$isWatched
        ? m.button_label_remove_from_watched({ title: target.title })
        : m.button_label_mark_as_watched({ title: target.title })}
        isSelected={$isWatched === true}
        isPending={$isWatchUpdating}
        isInert={!$isWatchedKnown || $isWatchUpdating}
        onclick={toggleWatched}
      />
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
        isInert={$isFavorite === undefined}
        onclick={toggleFavorite}
      />
    {/if}
  </div>
  {#if metadata}
    <div class="metadata">{@render metadata()}</div>
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
