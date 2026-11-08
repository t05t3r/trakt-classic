<script lang="ts">
  import * as m from "$lib/features/i18n/messages.ts";
  import IconX from "@tabler/icons-svelte/icons/x";
  import { tabStopOnOverflow } from "$lib/utils/actions/tabStopOnOverflow.ts";
  import { Dialog } from "bits-ui";
  import type { ModalProps } from "./_internal/ModalProps.ts";

  const { title, onClose, children, footer }: ModalProps = $props();
</script>

<Dialog.Root
  bind:open={
    () => true,
    (isOpen) => {
      if (!isOpen) onClose();
    }
  }
>
  <Dialog.Portal>
    <Dialog.Overlay class="trakt-modal-overlay" />
    <Dialog.Content class="trakt-modal" interactOutsideBehavior="close">
      <Dialog.Close class="modal-close" aria-label={m.button_label_close()}>
        <IconX class="modal-close-glyph" aria-hidden="true" />
      </Dialog.Close>
      <Dialog.Title>
        {#snippet child({ props })}
          <h2 {...props} class="modal-title">{title}</h2>
        {/snippet}
      </Dialog.Title>
      <div class="modal-body" use:tabStopOnOverflow>
        {@render children()}
      </div>
      {#if footer}
        <div class="modal-footer">
          {@render footer()}
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style lang="scss">
  @use "$style/scss/mixins/index" as *;

  :global(.trakt-modal-overlay) {
    position: fixed;
    inset: 0;
    z-index: var(--layer-dialog);

    background: var(--color-overlay-dark-80);
    animation: fade-in var(--transition-increment) linear;
  }

  :global(.trakt-modal) {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: var(--modal-width);
    max-height: calc(100dvh - 2 * var(--ni-20));
    padding-block: 0 var(--modal-padding-block-end);

    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: var(--layer-dialog);

    border-radius: var(--border-radius-xl);
    background: var(--color-modal-background);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-modal);
    animation: fade-in var(--transition-increment) linear;

    :global(.modal-close) {
      position: absolute;
      top: var(--ni-neg-5);
      inset-inline-end: var(--ni-neg-5);
      display: grid;
      place-items: center;
      padding: var(--ni-10);
      border: none;
      background: none;
      color: var(--color-modal-close);
      cursor: pointer;
    }

    :global(.modal-close-glyph) {
      width: var(--ni-16);
      height: var(--ni-16);
      stroke-width: var(--icon-stroke-chrome);
    }

    :global(.modal-title) {
      margin-block-start: var(--ni-15);
      margin-block-end: var(--ni-20);
      padding-inline: var(--modal-padding-inline);
      font-family: var(--font-family-body);
      font-size: var(--font-size-dialog-title);
      font-weight: var(--font-weight-body);
      text-align: center;
    }

    :global(.modal-body) {
      min-block-size: 0;
      // Here, not on the box, so the scroller doesn't clip a focus ring at its inline edge.
      padding-inline: var(--modal-padding-inline);
      overflow-y: auto;
    }

    :global(.modal-footer) {
      display: flex;
      justify-content: center;
      gap: var(--ni-10);
      margin-block-start: var(--ni-20);
      padding-inline: var(--modal-padding-inline);
    }

    // The title and footer leave the body little room here, so the whole box scrolls.
    @include for-short-viewport {
      overflow-y: auto;

      :global(.modal-close) {
        top: 0;
        inset-inline-end: 0;
      }

      :global(.modal-body) {
        flex-shrink: 0;
        overflow-y: visible;
      }

      :global(.modal-title),
      :global(.modal-footer) {
        flex-shrink: 0;
      }
    }
  }
</style>
