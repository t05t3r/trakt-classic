<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import { appendClassList } from '$lib/utils/actions/appendClassList.ts';
  import type { Snippet } from 'svelte';
  import type { Attachment } from 'svelte/attachments';

  const { children, classList = '' }: { children: Snippet; classList?: string } =
    $props();

  let content: HTMLElement | undefined = $state();
  let isOverflowing = $state(false);
  let isExpanded = $state(false);

  const isTruncated = $derived(isOverflowing && !isExpanded);

  const measureOverflow: Attachment<HTMLElement> = (node) => {
    const observer = new ResizeObserver(() => {
      isOverflowing = node.scrollHeight > node.clientHeight;
    });
    observer.observe(node);

    return () => observer.disconnect();
  };

  // The button leaves once pressed, so the focus moves to the text it revealed.
  const expand = () => {
    isExpanded = true;
    content?.focus({ preventScroll: true });
  };
</script>

<div class="trakt-clamped-text">
  <div
    bind:this={content}
    class="clamped-content"
    class:is-clamped={!isExpanded}
    tabindex="-1"
    use:appendClassList={classList}
    {@attach measureOverflow}
  >
    {@render children()}
    {#if isTruncated}
      <div class="clamped-shade"></div>
    {/if}
  </div>

  {#if isTruncated}
    <button
      type="button"
      class="read-more-button"
      aria-expanded="false"
      onclick={expand}
    >
      {m.button_label_read_more()}
    </button>
  {/if}
</div>

<style lang="scss">
  .trakt-clamped-text {
    .clamped-content {
      position: relative;

      /* It takes focus only from script, once Read more leaves. */
      &:focus {
        outline: none;
      }

      &.is-clamped {
        max-height: var(--clamp-max-height);
        overflow: hidden;
      }
    }

    .clamped-shade {
      position: absolute;
      inset-inline: 0;
      inset-block-end: 0;

      height: var(--clamp-shade-height);

      background: linear-gradient(
        to bottom,
        transparent,
        var(--clamp-shade-color, var(--color-background))
      );
      pointer-events: none;
    }

    .read-more-button {
      padding: var(--ni-0);
      border: none;
      background: none;
      color: var(--color-link);
      font: inherit;
      cursor: pointer;
    }
  }
</style>
