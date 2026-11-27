<script lang="ts">
  import { onMount } from 'svelte';
  import HintTooltip from './_internal/HintTooltip.svelte';
  import {
    closestHinted,
    hideHint,
    readHint,
    showHint,
    shownHinted,
  } from './hint.svelte.ts';

  const OPEN_DELAY = 150;

  let hovered: HTMLElement | null = null;
  let opening: ReturnType<typeof setTimeout> | undefined;
  let focusFrame = 0;

  // At most one, in a list that keeps each tooltip to the element it opened for.
  const open = $derived.by(() => {
    const element = shownHinted();
    const hint = element && readHint(element);
    return element && hint ? [{ element, hint }] : [];
  });

  const hide = () => {
    const element = shownHinted();
    if (element) hideHint(element);
  };

  const isShownAround = (target: EventTarget | null) =>
    target instanceof Node && shownHinted()?.contains(target);

  const show = (element: HTMLElement) => {
    clearTimeout(opening);
    showHint(element);
  };

  // The scroll that reveals a focused element fires before the next frame's callbacks.
  const dismiss = (element: HTMLElement) => {
    if (focusFrame === 0) hideHint(element);
  };

  const enter = (next: HTMLElement | null) => {
    if (next === hovered) return;

    // Any other tooltip closes as the pointer leaves both it and its element.
    if (hovered && readHint(hovered)?.isPassThrough) hideHint(hovered);
    hovered = next;
    clearTimeout(opening);
    if (next) opening = setTimeout(() => show(next), OPEN_DELAY);
  };

  const trackHover = ({ target, pointerType }: PointerEvent) => {
    if (pointerType === 'touch') return;

    const next = closestHinted(target);
    // Still over the shown element, so an inner element's hint takes over.
    if (next !== shownHinted() && isShownAround(target)) hide();
    enter(next);
  };

  // No element takes the pointer as it leaves the window.
  const trackLeave = ({ relatedTarget }: PointerEvent) => {
    if (!relatedTarget) enter(null);
  };

  const trackPress = ({ target }: Event) => {
    const pressed = closestHinted(target);
    if (pressed && readHint(pressed)?.keepOpenOnPress) return;

    clearTimeout(opening);
    if (isShownAround(target)) hide();
  };

  const trackFocus = ({ target }: FocusEvent) => {
    const hinted = closestHinted(target);
    // Only the focused element matches, so a link inside a hinted box opens nothing.
    if (!hinted?.matches(':focus-visible')) return;

    show(hinted);
    focusFrame = requestAnimationFrame(() => (focusFrame = 0));
  };

  const trackBlur = ({ target }: FocusEvent) => {
    if (target === shownHinted()) hide();
  };

  onMount(() => () => {
    clearTimeout(opening);
    cancelAnimationFrame(focusFrame);
    hide();
  });
</script>

<svelte:document
  onpointerover={trackHover}
  onpointerout={trackLeave}
  onpointerdown={trackPress}
  onclick={trackPress}
  onfocusin={trackFocus}
  onfocusout={trackBlur}
/>

{#each open as { element, hint } (element)}
  <HintTooltip {element} {hint} ondismiss={() => dismiss(element)} />
{/each}
