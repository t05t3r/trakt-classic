<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import { tick, untrack } from 'svelte';
  import type { SpoilerRevealProps } from './SpoilerRevealProps.ts';

  const { children, display, revealed = false }: SpoilerRevealProps =
    $props();

  const tag = $derived(display === 'block' ? 'div' : 'span');

  let content: HTMLElement | undefined = $state();
  let button: HTMLButtonElement | undefined = $state();
  // Never conceals again once shown, so the focus is never left in content turned inert.
  let wasRevealed = $state(false);
  const isRevealed = $derived(wasRevealed || revealed);

  // The button leaves once revealed, so the focus it held moves to the
  // content, once it is no longer inert.
  const focusContent = async () => {
    await tick();
    content?.focus({ preventScroll: true });
  };

  // Before the update, while the button that leaves can still hold the focus.
  $effect.pre(() => {
    if (!revealed) return;
    const leaving = untrack(() => button);
    const heldFocus = leaving != null && leaving === document.activeElement;
    wasRevealed = true;
    if (heldFocus) void focusContent();
  });

  const reveal = () => {
    wasRevealed = true;
    void focusContent();
  };
</script>

<svelte:element
  this={tag}
  class="trakt-spoiler-reveal"
  class:is-concealed={!isRevealed}
  data-display={display}
>
  <svelte:element
    this={tag}
    bind:this={content}
    class="spoiler-content"
    class:is-blurred={!isRevealed}
    inert={isRevealed ? undefined : true}
    tabindex="-1"
  >
    {@render children()}
  </svelte:element>

  {#if !isRevealed}
    <button
      type="button"
      class="reveal-button"
      bind:this={button}
      aria-expanded="false"
      aria-label={m.button_label_show_spoiler()}
      onclick={reveal}
    ></button>
  {/if}
</svelte:element>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-spoiler-reveal {
    position: relative;

    /* A wrapped inline box would stretch the button over its neighbours. */
    &[data-display='inline'].is-concealed {
      display: inline-block;
    }

    .spoiler-content {
      /* It takes focus only from script, once the button leaves. */
      &:focus {
        outline: none;
      }

      &.is-blurred {
        @include spoiler-blur;
      }
    }

    .reveal-button {
      position: absolute;
      inset: 0;

      padding: var(--ni-0);
      border: none;
      background: none;
      cursor: pointer;
    }
  }
</style>
