<script lang="ts">
  import { hint } from '$lib/components/tooltip/hint.svelte.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import IconCheck from '@tabler/icons-svelte/icons/check';
  import { hasTargetAired } from './hasTargetAired.ts';
  import QuickIcon from './QuickIcon.svelte';
  import { toWatchHover } from './toWatchHover.ts';
  import WatchHover from './WatchHover.svelte';
  import type { WatchIconProps } from './WatchIconProps.ts';

  const {
    target,
    isPlayed,
    isKnown,
    isUpdating,
    playedAt,
    plays,
    watchedEpisodes,
    onadd,
    onremove,
  }: WatchIconProps = $props();

  const isSelected = $derived(isPlayed === true);
  // Only a known absence of Plays blocks it: an unknown history may hold one.
  const isUnreleased = $derived(
    isPlayed === false && !hasTargetAired(target),
  );
  const watchHover = $derived(
    toWatchHover({ target, isPlayed, playedAt, plays, watchedEpisodes }),
  );
  const label = $derived.by(() => {
    const { title } = target;
    if (isSelected) return m.button_label_remove_from_watched({ title });

    const action = m.button_label_mark_as_watched({ title });

    // A touch screen reader never gets the tooltip, so the name holds its reason.
    return isUnreleased
      ? m.button_label_blocked_action({
        action,
        reason: m.tooltip_text_not_released_yet(),
      })
      : action;
  });

  const toggle = () => isSelected ? onremove() : onadd();
</script>

{#snippet hover()}
  {#if watchHover}
    <WatchHover hover={watchHover} />
  {/if}
{/snippet}

<!-- The tooltip may open over a card's title, whose click it must not take. -->
<QuickIcon
  action="watch"
  icon={IconCheck}
  {label}
  {isSelected}
  isPending={isUpdating}
  isInert={!isKnown || isUpdating}
  isBlocked={isUnreleased}
  onclick={toggle}
  {@attach hint(() =>
    watchHover && {
      content: hover,
      side: 'bottom',
      isPassThrough: true,
      keepOpenOnPress: isUnreleased,
    }
  )}
/>
