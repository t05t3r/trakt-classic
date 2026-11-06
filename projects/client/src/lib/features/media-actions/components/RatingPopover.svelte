<script lang="ts">
  import Popover from '$lib/components/menus/Popover.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { RATING_VALUES } from '$lib/features/media-actions/RATING_VALUES.ts';
  import { useRating } from '$lib/features/media-actions/stores/useRating.ts';
  import { toRatingLabel } from '$lib/features/media-actions/toRatingLabel.ts';
  import { toRovingIndex } from '$lib/utils/events/toRovingIndex.ts';
  import IconHeartFilled from '@tabler/icons-svelte/icons/heart-filled';
  import type {
    RatingPopoverProps,
    ShownRating,
  } from './_internal/RatingPopoverProps.ts';

  const HEARTS = RATING_VALUES.map(Number);

  const { target, label, side = 'top', trigger: face }: RatingPopoverProps =
    $props();

  // The caller keys this popover by its target, so the store made here serves its whole life.
  // svelte-ignore state_referenced_locally
  const { rating, rate, remove } = useRating(target);

  let open = $state(false);
  let hovered = $state<number | null>(null);
  let focused = $state<number | null>(null);

  // Hearts leave without a blur or a pointer leave, so a close drops their preview.
  const setOpen = (next: boolean) => {
    open = next;
    if (next) return;
    hovered = null;
    focused = null;
  };

  const toShown = (
    value: number,
    kind: ShownRating['kind'],
  ): ShownRating => ({
    value,
    label: toRatingLabel(value),
    kind,
  });

  const previewed = $derived(hovered ?? focused);
  const shown = $derived.by(() => {
    if (previewed !== null) {
      return toShown(previewed, previewed === $rating ? 'unrate' : 'preview');
    }
    if ($rating == null) return null;
    return toShown($rating, 'stored');
  });
  const run = $derived(previewed ?? $rating ?? 0);
  const tabStop = $derived($rating ?? 1);

  const pick = (value: number) => {
    const current = $rating;
    setOpen(false);
    if (value === current) return remove();
    return rate(value);
  };

  const id = $props.id();
  const heartId = (value: number) => `${id}-heart-${value}`;

  const onKeydown = (
    event: KeyboardEvent & { currentTarget: HTMLButtonElement },
    value: number,
  ) => {
    // A modified key belongs to the browser: Alt+ArrowLeft is Back.
    if (event.altKey || event.metaKey || event.ctrlKey) return;

    const next = toRovingIndex({
      key: event.key,
      from: value - 1,
      count: HEARTS.length,
      isRtl: event.currentTarget.matches(':dir(rtl)'),
    });
    if (next === undefined) return;

    event.preventDefault();
    document.getElementById(heartId(next + 1))?.focus();
  };

  // Opening by pointer focuses a heart too; only keyboard focus previews.
  const onFocus = (heart: HTMLButtonElement, value: number) => {
    focused = heart.matches(':focus-visible') ? value : null;
  };

  const heartName = (value: number) => {
    const label = toRatingLabel(value);
    return value === 1
      ? m.label_rating_heart_one({ label })
      : m.label_rating_heart_other({ count: value, label });
  };
</script>

<Popover
  {label}
  {side}
  bind:open={() => open, setOpen}
>
  {#snippet trigger({ props })}
    {@render face({ props, shown, isOpen: open })}
  {/snippet}

  <div class="trakt-rating-popover">
    {#each HEARTS as value (value)}
      <button
        type="button"
        class="rating-heart"
        id={heartId(value)}
        aria-label={heartName(value)}
        aria-pressed={value === $rating}
        tabindex={value === tabStop ? 0 : -1}
        data-rating={value <= run ? run : undefined}
        onpointerenter={() => (hovered = value)}
        onpointerleave={() => (hovered = null)}
        onfocus={(event) => onFocus(event.currentTarget, value)}
        onblur={() => (focused = null)}
        onkeydown={(event) => onKeydown(event, value)}
        onclick={() => pick(value)}
      >
        <IconHeartFilled aria-hidden="true" />
      </button>
    {/each}
  </div>
</Popover>

<style lang="scss">
  .trakt-rating-popover {
    display: flex;

    .rating-heart {
      display: flex;
      align-items: center;
      box-sizing: border-box;
      inline-size: var(--rating-heart-width);
      block-size: var(--rating-heart-height);
      padding-block: 0;
      padding-inline: var(--rating-heart-padding-inline);
      overflow: hidden;

      border: none;
      background: none;
      color: var(--color-rating-heart-unchecked);
      cursor: pointer;

      &:active {
        position: relative;
        inset-block-start: var(--rating-heart-press-offset);
        inset-inline-start: var(--rating-heart-press-offset);
      }

      :global(svg) {
        flex-shrink: 0;
        width: var(--rating-heart-size);
        height: var(--rating-heart-size);
      }
    }

    @for $rating from 1 through 10 {
      .rating-heart[data-rating='#{$rating}'] {
        color: var(--color-rating-#{$rating});
      }
    }

    // Classic fades the colours only while the pointer is on the row.
    &:hover .rating-heart {
      transition: color var(--transition-instant);
    }
  }
</style>
